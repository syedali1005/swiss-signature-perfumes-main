import { NextResponse } from 'next/server';
import { saveOrder, getStoredOrders, updateOrderStatus } from '@/lib/orders-store';
import { verifyAdminRole } from '@/lib/auth';
import { calculateShippingFee } from '@/lib/shipping';
import { Order, OrderItem, ShippingAddress, PaymentMethod } from '@/lib/types';

// POST: Public endpoint to place an order (COD)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customer, paymentMethod, notes } = body as {
      items: OrderItem[];
      customer: ShippingAddress;
      paymentMethod: PaymentMethod;
      notes?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!customer || !customer.firstName || !customer.address || !customer.city || !customer.phone) {
      return NextResponse.json(
        { error: 'Shipping details are incomplete. Please fill in your name, address, city, and phone number.' },
        { status: 400 }
      );
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Dynamic shipping calculation
    const shippingCalc = calculateShippingFee(customer.city, customer.country || 'Pakistan');
    const shippingFee = shippingCalc.fee;
    const total = subtotal + shippingFee;

    const orderId = `SS-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customer,
      items,
      subtotal,
      shippingFee,
      total,
      paymentMethod: paymentMethod || 'cod',
      status: 'Pending',
      notes,
    };

    await saveOrder(newOrder);

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('[POST /api/orders] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to place order', detail: message }, { status: 500 });
  }
}

// GET: Admin route to fetch all orders
export async function GET(request: Request) {
  const authResult = await verifyAdminRole(request, ['admin', 'super_admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const orders = await getStoredOrders();
  return NextResponse.json({ success: true, orders });
}

// PATCH: Admin route to update order status
export async function PATCH(request: Request) {
  const authResult = await verifyAdminRole(request, ['admin', 'super_admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const updated = await updateOrderStatus(orderId, status);
    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('[PATCH /api/orders] Error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
