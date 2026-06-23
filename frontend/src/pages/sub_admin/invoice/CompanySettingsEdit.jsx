import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

export default function CompanySettingsEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
    default_gst_rate: "",
    default_sac_code: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    account_holder_name: "",
    default_terms: "",
    logo: null,
    signature: null,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await apiRequest("/invoice/api/settings/");
    if (res) {
      setForm((prev) => ({
        ...prev,
        ...res,
        logo: null,
        signature: null,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== "") {
        fd.append(key, form[key]);
      }
    });

    const res = await apiRequest("/invoice/api/settings/", "PUT", fd);

    setLoading(false);

    if (res?.message) {
      alert("Settings Updated Successfully");
      navigate("/sub-admin/invoice/settings");
    } else {
      alert("Update Failed");
    }
  };

  return (
    <SubAdminLayout>
      <div>
        <h2>Update Company Settings</h2>

        <form onSubmit={handleSubmit}>
          <h3>Company Info</h3>
          <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company Name" /><br /><br />
          <input name="address" value={form.address} onChange={handleChange} placeholder="Address" /><br /><br />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" /><br /><br />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" /><br /><br />
          <input name="gstin" value={form.gstin} onChange={handleChange} placeholder="GSTIN" /><br /><br />

          <h3>Defaults</h3>
          <input name="default_gst_rate" value={form.default_gst_rate} onChange={handleChange} placeholder="Default GST Rate" /><br /><br />
          <input name="default_sac_code" value={form.default_sac_code} onChange={handleChange} placeholder="Default SAC Code" /><br /><br />
          <textarea name="default_terms" value={form.default_terms} onChange={handleChange} placeholder="Default Terms" /><br /><br />

          <h3>Bank Details</h3>
          <input name="bank_name" value={form.bank_name} onChange={handleChange} placeholder="Bank Name" /><br /><br />
          <input name="account_number" value={form.account_number} onChange={handleChange} placeholder="Account Number" /><br /><br />
          <input name="ifsc_code" value={form.ifsc_code} onChange={handleChange} placeholder="IFSC Code" /><br /><br />
          <input name="account_holder_name" value={form.account_holder_name} onChange={handleChange} placeholder="Account Holder Name" /><br /><br />

          <h3>Upload Assets (Optional)</h3>
          <label>Logo:</label><br />
          <input type="file" name="logo" onChange={handleChange} /><br /><br />

          <label>Signature:</label><br />
          <input type="file" name="signature" onChange={handleChange} /><br /><br />

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Settings"}
          </button>
        </form>
      </div>
    </SubAdminLayout>
  );
}