import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    invoice_type: "CANDIDATE",
    candidate: "",
    client: "",
    vendor: "",

    bill_to_name: "",
    bill_to_company: "",
    bill_to_address: "",
    bill_to_gstin: "",
    bill_to_email: "",
    bill_to_phone: "",

    description: "",
    sac_code: "",
    gst_rate: "",

    invoice_date: "",
    billing_month: "",
    due_date: "",

    notes: "",

    items: [],
  });

  // ===============================
  // Load existing invoice
  // ===============================
  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    const res = await apiRequest(`/invoice/api/preview/${id}/`);
    if (!res) return;

    setForm({
      invoice_type: res.invoice_type || "CANDIDATE",
      candidate: res.candidate || "",
      client: res.client || "",
      vendor: res.vendor || "",

      bill_to_name: res.bill_to_name || "",
      bill_to_company: res.bill_to_company || "",
      bill_to_address: res.bill_to_address || "",
      bill_to_gstin: res.bill_to_gstin || "",
      bill_to_email: res.bill_to_email || "",
      bill_to_phone: res.bill_to_phone || "",

      description: res.description || "",
      sac_code: res.sac_code || "",
      gst_rate: res.gst_rate || "",

      invoice_date: res.invoice_date || "",
      billing_month: res.billing_month || "",
      due_date: res.due_date || "",

      notes: res.notes || "",

      items: res.items || [],
    });
  };

  // ===============================
  // Input Change
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // ===============================
  // Item Change
  // ===============================
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...form.items];
    items[index][name] = value;

    const rate = Number(items[index].rate || 0);
    const qty = Number(items[index].quantity || 0);
    items[index].amount = rate * qty;

    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        { title: "", description: "", sac_code: "", rate: "", quantity: 1, amount: "" },
      ],
    });
  };

  const removeItem = (index) => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  // ===============================
  // Submit Update
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      candidate: form.candidate || null,
      client: form.client || null,
      vendor: form.vendor || null,
    };

    const res = await apiRequest(`/invoice/api/update/${id}/`, "PUT", payload);
    setLoading(false);

    if (res?.invoice_id) {
      alert("Invoice Updated Successfully");
      navigate(`/sub-admin/invoice/preview/${id}`);
    } else {
      alert("Update Failed");
    }
  };

  return (
    <SubAdminLayout>
      <div>
        <h2>Edit Invoice</h2>

        <form onSubmit={handleSubmit}>
          <h3>Basic Info</h3>

          <label>Invoice Type:</label><br />
          <select name="invoice_type" value={form.invoice_type} onChange={handleChange}>
            <option value="CANDIDATE">Candidate</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <br /><br />

          <input name="candidate" value={form.candidate} onChange={handleChange} placeholder="Candidate ID" /><br /><br />
          <input name="vendor" value={form.vendor} onChange={handleChange} placeholder="Vendor ID" /><br /><br />
          <input name="client" value={form.client} onChange={handleChange} placeholder="Client ID" /><br /><br />

          <h3>Bill To</h3>
          <input name="bill_to_name" value={form.bill_to_name} onChange={handleChange} placeholder="Name" /><br /><br />
          <input name="bill_to_company" value={form.bill_to_company} onChange={handleChange} placeholder="Company" /><br /><br />
          <input name="bill_to_address" value={form.bill_to_address} onChange={handleChange} placeholder="Address" /><br /><br />
          <input name="bill_to_gstin" value={form.bill_to_gstin} onChange={handleChange} placeholder="GSTIN" /><br /><br />
          <input name="bill_to_email" value={form.bill_to_email} onChange={handleChange} placeholder="Email" /><br /><br />
          <input name="bill_to_phone" value={form.bill_to_phone} onChange={handleChange} placeholder="Phone" /><br /><br />

          <h3>Invoice Info</h3>
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" /><br /><br />
          <input name="sac_code" value={form.sac_code} onChange={handleChange} placeholder="SAC Code" /><br /><br />
          <input name="gst_rate" value={form.gst_rate} onChange={handleChange} placeholder="GST Rate" /><br /><br />

          <label>Invoice Date:</label><br />
          <input type="date" name="invoice_date" value={form.invoice_date} onChange={handleChange} /><br /><br />

          <label>Billing Month:</label><br />
          <input type="date" name="billing_month" value={form.billing_month} onChange={handleChange} /><br /><br />

          <label>Due Date:</label><br />
          <input type="date" name="due_date" value={form.due_date} onChange={handleChange} /><br /><br />

          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" /><br /><br />

          <h3>Items</h3>
          {form.items.map((item, i) => (
            <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
              <input name="title" value={item.title} onChange={(e) => handleItemChange(i, e)} placeholder="Title" /><br /><br />
              <input name="description" value={item.description} onChange={(e) => handleItemChange(i, e)} placeholder="Description" /><br /><br />
              <input name="sac_code" value={item.sac_code} onChange={(e) => handleItemChange(i, e)} placeholder="SAC" /><br /><br />
              <input name="rate" value={item.rate} onChange={(e) => handleItemChange(i, e)} placeholder="Rate" /><br /><br />
              <input name="quantity" value={item.quantity} onChange={(e) => handleItemChange(i, e)} placeholder="Qty" /><br /><br />
              <input value={item.amount} readOnly placeholder="Amount" /><br /><br />

              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)}>Remove</button>
              )}
            </div>
          ))}

          <button type="button" onClick={addItem}>+ Add Item</button>

          <br /><br />
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Invoice"}
          </button>
        </form>
      </div>
    </SubAdminLayout>
  );
}