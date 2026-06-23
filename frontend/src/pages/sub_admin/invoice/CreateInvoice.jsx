import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

export default function CreateInvoice() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
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
    gst_rate: 18,

    invoice_date: "",
    billing_month: "",
    due_date: "",

    notes: "",

    items: [
      {
        title: "",
        description: "",
        sac_code: "",
        rate: "",
        quantity: 1,
        amount: "",
      },
    ],
  });

  // ===============================
  // Load Candidates
  // ===============================
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const res = await apiRequest("/sub-admin/api/candidates/onboard/");
    if (res?.results) setCandidates(res.results);
  };

  // ===============================
  // Candidate Select
  // ===============================
  const handleCandidateSelect = (id) => {
    const c = candidates.find((x) => x.id === Number(id));
    if (!c) return;

    setForm((prev) => ({
      ...prev,
      candidate: c.id,
      vendor: c.vendor || "",
      client: c.client || "",
    }));
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
  // Submit
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

    const res = await apiRequest("/invoice/api/create/", "POST", payload);

    setLoading(false);

    if (res?.invoice_id) {
      alert("Invoice Created Successfully");
      navigate(`/sub-admin/invoice/preview/${res.invoice_id}`);
    } else {
      alert("Error creating invoice");
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <SubAdminLayout>
    <div>
      <h2>Create Invoice</h2>

      <form onSubmit={handleSubmit}>
        {/* ================= Candidate Section ================= */}
        <h3>Candidate Selection</h3>

        <label>Select Candidate:</label><br />
        <select onChange={(e) => handleCandidateSelect(e.target.value)}>
          <option value="">-- Select Candidate --</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.candidate_name} (ID: {c.id})
            </option>
          ))}
        </select>

        <br /><br />

        <label>Candidate ID:</label><br />
        <input
          name="candidate"
          value={form.candidate}
          onChange={handleChange}
          placeholder="Candidate ID"
        />

        <br /><br />

        <label>Vendor ID:</label><br />
        <input
          name="vendor"
          value={form.vendor}
          onChange={handleChange}
          placeholder="Vendor ID"
        />

        <br /><br />

        <label>Client ID:</label><br />
        <input
          name="client"
          value={form.client}
          onChange={handleChange}
          placeholder="Client ID"
        />

        <hr />

        {/* ================= Bill To Section ================= */}
        <h3>Bill To Details</h3>

        <input name="bill_to_name" placeholder="Bill To Name" onChange={handleChange} /><br /><br />
        <input name="bill_to_company" placeholder="Company Name" onChange={handleChange} /><br /><br />
        <input name="bill_to_address" placeholder="Address" onChange={handleChange} /><br /><br />
        <input name="bill_to_gstin" placeholder="GSTIN" onChange={handleChange} /><br /><br />
        <input name="bill_to_email" placeholder="Email" onChange={handleChange} /><br /><br />
        <input name="bill_to_phone" placeholder="Phone" onChange={handleChange} /><br /><br />

        <hr />

        {/* ================= Invoice Info ================= */}
        <h3>Invoice Information</h3>

        <input name="description" placeholder="Invoice Description" onChange={handleChange} /><br /><br />
        <input name="sac_code" placeholder="SAC Code" onChange={handleChange} /><br /><br />
        <input name="gst_rate" type="number" placeholder="GST Rate (%)" onChange={handleChange} /><br /><br />

        <label>Invoice Date (Invoice banane ki date):</label><br />
        <input name="invoice_date" type="date" onChange={handleChange} /><br /><br />

        <label>Billing Month (Jis month ka bill hai):</label><br />
        <input name="billing_month" type="date" onChange={handleChange} /><br /><br />

        <label>Due Date (Payment last date):</label><br />
        <input name="due_date" type="date" onChange={handleChange} /><br /><br />

        <textarea name="notes" placeholder="Notes" onChange={handleChange} /><br /><br />

        <hr />

        {/* ================= Items ================= */}
        <h3>Invoice Items</h3>

        {form.items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
            <input name="title" placeholder="Item Title" onChange={(e) => handleItemChange(i, e)} /><br /><br />
            <input name="description" placeholder="Item Description" onChange={(e) => handleItemChange(i, e)} /><br /><br />
            <input name="sac_code" placeholder="Item SAC Code" onChange={(e) => handleItemChange(i, e)} /><br /><br />
            <input name="rate" type="number" placeholder="Rate" onChange={(e) => handleItemChange(i, e)} /><br /><br />
            <input name="quantity" type="number" placeholder="Quantity" onChange={(e) => handleItemChange(i, e)} /><br /><br />
            <input value={item.amount} readOnly placeholder="Amount (Auto)" /><br /><br />

            {form.items.length > 1 && (
              <button type="button" onClick={() => removeItem(i)}>Remove Item</button>
            )}
          </div>
        ))}

        <button type="button" onClick={addItem}>+ Add Item</button>

        <br /><br />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </div>
    </SubAdminLayout>
  );
}






// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../../services/api";
// import SubAdminLayout from "../../components/SubAdminLayout";

// export default function CreateInvoice() {
//   const navigate = useNavigate();

//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [form, setForm] = useState({
//     invoice_type: "CANDIDATE",
//     candidate: "",
//     client: "",
//     vendor: "",

//     bill_to_name: "",
//     bill_to_company: "",
//     bill_to_address: "",
//     bill_to_gstin: "",
//     bill_to_email: "",
//     bill_to_phone: "",

//     description: "",
//     sac_code: "",
//     gst_rate: 18,

//     invoice_date: "",
//     billing_month: "",
//     due_date: "",

//     notes: "",

//     items: [
//       {
//         title: "",
//         description: "",
//         sac_code: "",
//         rate: "",
//         quantity: 1,
//         amount: "",
//       },
//     ],
//   });

//   // 🔹 Load Candidates
//   useEffect(() => {
//     fetchCandidates();
//   }, []);

//   const fetchCandidates = async () => {
//     const res = await apiRequest("/sub-admin/api/candidates/onboard/");
//     if (res?.results) setCandidates(res.results);
//   };

//   // 🔹 Candidate Select
//   const handleCandidateSelect = (id) => {
//     const c = candidates.find((x) => x.id === Number(id));
//     if (!c) return;

//     setForm((prev) => ({
//       ...prev,
//       candidate: c.id,
//       vendor: c.vendor || "",
//       client: c.client || "",
//     }));
//   };

//   // 🔹 Input Change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm({ ...form, [name]: value });
//   };

//   // 🔹 Item Change
//   const handleItemChange = (index, e) => {
//     const { name, value } = e.target;
//     const items = [...form.items];
//     items[index][name] = value;

//     const rate = Number(items[index].rate || 0);
//     const qty = Number(items[index].quantity || 0);
//     items[index].amount = rate * qty;

//     setForm({ ...form, items });
//   };

//   const addItem = () => {
//     setForm({
//       ...form,
//       items: [
//         ...form.items,
//         { title: "", description: "", sac_code: "", rate: "", quantity: 1, amount: "" },
//       ],
//     });
//   };

//   const removeItem = (index) => {
//     const items = form.items.filter((_, i) => i !== index);
//     setForm({ ...form, items });
//   };

//   // 🔹 Submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const payload = {
//       ...form,
//       candidate: form.candidate || null,
//       client: form.client || null,
//       vendor: form.vendor || null,
//     };

//     const res = await apiRequest("/invoice/api/create/", "POST", payload);

//     setLoading(false);

//     if (res?.invoice_id) {
//       alert("Invoice Created");
//       navigate(`/sub-admin/invoice/preview/${res.invoice_id}`);
//     } else {
//       alert("Error creating invoice");
//     }
//   };

//   return (
//     <SubAdminLayout>
//     <div>
//       <h2>Create Invoice</h2>

//       <form onSubmit={handleSubmit}>
//         <h4>Candidate</h4>
//         <select onChange={(e) => handleCandidateSelect(e.target.value)}>
//           <option value="">Select Candidate</option>
//           {candidates.map((c) => (
//             <option key={c.id} value={c.id}>
//               {c.candidate_name} (ID: {c.id})
//             </option>
//           ))}
//         </select>

//         <h4>Bill To</h4>
//         <input name="bill_to_name" placeholder="Name" onChange={handleChange} />
//         <input name="bill_to_company" placeholder="Company" onChange={handleChange} />
//         <input name="bill_to_address" placeholder="Address" onChange={handleChange} />
//         <input name="bill_to_gstin" placeholder="GSTIN" onChange={handleChange} />
//         <input name="bill_to_email" placeholder="Email" onChange={handleChange} />
//         <input name="bill_to_phone" placeholder="Phone" onChange={handleChange} />

//         <h4>Invoice Info</h4>
//         <input name="description" placeholder="Description" onChange={handleChange} />
//         <input name="sac_code" placeholder="SAC Code" onChange={handleChange} />
//         <input name="gst_rate" type="number" placeholder="GST %" onChange={handleChange} />

//         <input name="invoice_date" type="date" onChange={handleChange} />
//         <input name="billing_month" type="date" onChange={handleChange} />
//         <input name="due_date" type="date" onChange={handleChange} />

//         <textarea name="notes" placeholder="Notes" onChange={handleChange} />

//         <h4>Items</h4>
//         {form.items.map((item, i) => (
//           <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
//             <input name="title" placeholder="Title" onChange={(e) => handleItemChange(i, e)} />
//             <input name="description" placeholder="Description" onChange={(e) => handleItemChange(i, e)} />
//             <input name="sac_code" placeholder="SAC Code" onChange={(e) => handleItemChange(i, e)} />
//             <input name="rate" type="number" placeholder="Rate" onChange={(e) => handleItemChange(i, e)} />
//             <input name="quantity" type="number" placeholder="Qty" onChange={(e) => handleItemChange(i, e)} />
//             <input value={item.amount} readOnly placeholder="Amount" />

//             {form.items.length > 1 && (
//               <button type="button" onClick={() => removeItem(i)}>Remove</button>
//             )}
//           </div>
//         ))}

//         <button type="button" onClick={addItem}>Add Item</button>

//         <br /><br />
//         <button type="submit" disabled={loading}>
//           {loading ? "Creating..." : "Create Invoice"}
//         </button>
//       </form>
//     </div>
//     </SubAdminLayout>
//   );
  
// }