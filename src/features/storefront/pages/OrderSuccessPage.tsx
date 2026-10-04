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
                className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xl"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white shadow-md"
                >
                    <CheckCircle2 className="h-10 w-10 text-white" />
                </motion.div>
                <h1 className="font-serif text-3xl font-extrabold text-black">Order Confirmed</h1>
                <p className="mt-2 text-neutral-600 text-sm font-medium">
                    Thank you for your purchase. A confirmation email is on its way.
                </p>
                {orderNumber && (
                    <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Order Number</p>
                        <p className="font-mono text-xl font-extrabold text-black mt-1">#{orderNumber}</p>
                    </div>
                )}
                <div className="mt-8 flex flex-col gap-3">
                    <Button asChild size="lg" className="rounded-xl bg-black text-white hover:bg-neutral-800 font-extrabold h-12 shadow-md">
                        <Link to="/account/orders">View My Orders</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-xl border-2 border-black bg-white text-black hover:bg-neutral-100 font-extrabold h-12 shadow-xs">
                        <Link to="/shop">Continue Shopping</Link>
                    </Button>
                </div>
                <p className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500 font-medium">
                    <Package className="h-3.5 w-3.5 text-black" /> Track your order from your account dashboard
                </p>
            </motion.div>
        </div>
    );
}
