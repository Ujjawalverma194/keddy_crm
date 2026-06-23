import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

export default function InvoicePreview() {
  const { invoice_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreview();
  }, [invoice_id]);

  const fetchPreview = async () => {
    setLoading(true);
    const res = await apiRequest(`/invoice/api/preview/${invoice_id}/`);
    setData(res);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No Data</div>;

  return (
    <SubAdminLayout>
    <div>
      <h2>Invoice Preview</h2>

      {/* ================= Header ================= */}
      <h3>Invoice Info</h3>
      <p><b>Invoice Number:</b> {data.invoice_number}</p>
      <p><b>Status:</b> {data.status}</p>
      <p><b>Invoice Date:</b> {data.invoice_date}</p>
      <p><b>Billing Month:</b> {data.billing_month}</p>
      <p><b>Candidate:</b> {data.candidate_name}</p>

      <hr />

      {/* ================= Company ================= */}
      <h3>From (Company Details)</h3>
      <p><b>Name:</b> {data.company?.company_name}</p>
      <p><b>Address:</b> {data.company?.address}</p>
      <p><b>Phone:</b> {data.company?.phone}</p>
      <p><b>Email:</b> {data.company?.email}</p>
      <p><b>GSTIN:</b> {data.company?.gstin}</p>

      <h4>Bank Details</h4>
      <p><b>Bank:</b> {data.company?.bank_name}</p>
      <p><b>Account No:</b> {data.company?.account_number}</p>
      <p><b>IFSC:</b> {data.company?.ifsc_code}</p>
      <p><b>Holder:</b> {data.company?.account_holder_name}</p>

      <hr />

      {/* ================= Bill To ================= */}
      <h3>Bill To</h3>
      <p><b>Name:</b> {data.bill_to_name}</p>
      <p><b>Company:</b> {data.bill_to_company}</p>
      <p><b>Address:</b> {data.bill_to_address}</p>
      <p><b>GSTIN:</b> {data.bill_to_gstin}</p>
      <p><b>Email:</b> {data.bill_to_email}</p>
      <p><b>Phone:</b> {data.bill_to_phone}</p>

      <hr />

      {/* ================= Description ================= */}
      <h3>Description</h3>
      <p>{data.description}</p>
      <p><b>SAC Code:</b> {data.sac_code}</p>

      <hr />

      {/* ================= Items ================= */}
      <h3>Items</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>SAC</th>
            <th>Rate</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items?.map((item, i) => (
            <tr key={i}>
              <td>{item.title}</td>
              <td>{item.description}</td>
              <td>{item.sac_code}</td>
              <td>{item.rate}</td>
              <td>{item.quantity}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* ================= Totals ================= */}
      <h3>Totals</h3>
      <p><b>Subtotal:</b> ₹ {data.subtotal}</p>
      <p><b>GST Rate:</b> {data.gst_rate}%</p>
      <p><b>GST Amount:</b> ₹ {data.gst_amount}</p>
      <p><b>Total Amount:</b> ₹ {data.total_amount}</p>

      <hr />

      {/* ================= Notes ================= */}
      <h3>Notes</h3>
      <p>{data.notes}</p>

      <h4>Terms</h4>
      <p>{data.company?.terms}</p>
    </div>
    </SubAdminLayout>
  );
}