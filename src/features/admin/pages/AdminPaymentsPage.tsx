import { Banknote } from "lucide-react";
import AdminPlaceholderPage from "./AdminPlaceholderPage";

export default function AdminPaymentsPage() {
    return (
        <AdminPlaceholderPage
            title="Payment Settings"
            description="This store uses Cash on Delivery (COD) only. No online payment provider is configured."
            icon={Banknote}
        />
    );
}
