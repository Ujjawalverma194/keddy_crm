import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

export default function CompanySettingsView() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await apiRequest("/invoice/api/settings/");
    setData(res);
    setLoading(false);
  };

  if (loading) return <SubAdminLayout><div>Loading...</div></SubAdminLayout>;
  if (!data) return <SubAdminLayout><div>No Data</div></SubAdminLayout>;

  return (
    <SubAdminLayout>
      <div>
        <h2>Company Finance Settings</h2>

        <button onClick={() => navigate("/sub-admin/invoice/settings/edit")}>
          Update Settings
        </button>

        <hr />

        <h3>Company Info</h3>
        <p><b>Name:</b> {data.company_name}</p>
        <p><b>Address:</b> {data.address}</p>
        <p><b>Phone:</b> {data.phone}</p>
        <p><b>Email:</b> {data.email}</p>
        <p><b>GSTIN:</b> {data.gstin}</p>

        <h3>Defaults</h3>
        <p><b>Default GST Rate:</b> {data.default_gst_rate}%</p>
        <p><b>Default SAC Code:</b> {data.default_sac_code}</p>
        <p><b>Default Terms:</b> {data.default_terms}</p>

        <h3>Bank Details</h3>
        <p><b>Bank:</b> {data.bank_name}</p>
        <p><b>Account No:</b> {data.account_number}</p>
        <p><b>IFSC:</b> {data.ifsc_code}</p>
        <p><b>Account Holder:</b> {data.account_holder_name}</p>

        <h3>Assets</h3>
        <p><b>Logo:</b></p>
        {data.logo ? (
          <img src={data.logo} alt="logo" width="120" />
        ) : (
          <p>No Logo</p>
        )}

        <p><b>Signature:</b></p>
        {data.signature ? (
          <img src={data.signature} alt="sign" width="120" />
        ) : (
          <p>No Signature</p>
        )}
      </div>
    </SubAdminLayout>
  );
}