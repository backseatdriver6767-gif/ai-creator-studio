"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useProducts } from "@/lib/hooks";
import { Plus, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProductsPage() {
  const { data, isLoading } = useProducts();
  const products = data as {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    checkoutUrl: string | null;
    campaign: { id: string; name: string } | null;
    _count: { orders: number };
  }[] | undefined;

  return (
    <div>
      <TopBar title="Products">
        <Link href="/products/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Product</Button>
        </Link>
      </TopBar>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !products?.length ? (
          <EmptyState
            icon={ShoppingBag}
            title="No products yet"
            description="Create a digital product to sell through your AI content"
            action={
              <Link href="/products/new">
                <Button><Plus className="h-4 w-4 mr-2" /> Create Product</Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Checkout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${(product.price / 100).toFixed(2)} {product.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {product.campaign ? (
                      <Link href={`/campaigns/${product.campaign.id}`} className="text-muted-foreground hover:underline">
                        {product.campaign.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{product._count.orders}</TableCell>
                  <TableCell>
                    {product.checkoutUrl ? (
                      <a href={product.checkoutUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Open
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
