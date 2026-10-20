import { NextResponse } from 'next/server';
import { getStoredProducts } from '@/lib/orders-store';

export async function GET() {
  try {
    const products = await getStoredProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('[GET /api/products] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
