import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
    const { orderNumber } = useParams();

    return (
        <div className="container-bk flex min-h-[70vh] items-center justify-center py-16">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-2xl border border-border bg-bg-secondary p-8 text-center shadow-soft"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-state-success/15"
                >
                    <CheckCircle2 className="h-10 w-10 text-state-success" />
                </motion.div>
                <h1 className="font-serif text-3xl font-semibold">Order Confirmed</h1>
                <p className="mt-2 text-text-secondary">
                    Thank you for your purchase. A confirmation email is on its way.
                </p>
                {orderNumber && (
                    <div className="mt-6 rounded-xl border border-border bg-bg-primary p-4">
                        <p className="text-sm text-text-secondary">Order Number</p>
                        <p className="font-serif text-xl font-semibold">{orderNumber}</p>
                    </div>
                )}
                <div className="mt-8 flex flex-col gap-3">
                    <Button asChild size="lg"><Link to="/account/orders">View My Orders</Link></Button>
                    <Button asChild variant="secondary" size="lg"><Link to="/shop">Continue Shopping</Link></Button>
                </div>
                <p className="mt-6 flex items-center justify-center gap-2 text-xs text-text-secondary">
                    <Package className="h-3.5 w-3.5" /> Track your order from your account dashboard
                </p>
            </motion.div>
        </div>
    );
}
