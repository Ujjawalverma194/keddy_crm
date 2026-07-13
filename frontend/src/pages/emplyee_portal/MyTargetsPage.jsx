import React from "react";
import BaseLayout from "../components/emp_base";
import MyTargetsCard from "../../components/MyTargetsCard";

export default function MyTargetsPage() {
    return (
        <BaseLayout>
            <div style={{ padding: "20px" }}>
                <MyTargetsCard />
            </div>
        </BaseLayout>
    );
}
