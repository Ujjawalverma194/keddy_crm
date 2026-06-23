import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

export default function CandidateInvoiceHistory() {
  const { candidateId } = useParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [candidateId]);

  const fetchHistory = async () => {
    setLoading(true);

    const res = await apiRequest(
      `/invoice/api/candidate/${candidateId}/invoices/`
    );

    if (res?.results) setData(res.results);

    setLoading(false);
  };

  if (loading)
    return (
      <SubAdminLayout>
        <div>Loading...</div>
      </SubAdminLayout>
    );

  return (
    <SubAdminLayout>
      <div>
        <h2>Candidate Invoice History</h2>

        <table border="1" cellPadding="8" width="100%">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Candidate</th>
              <th>Invoice Date</th>
              <th>Billing Month</th>
              <th>Total</th>
              <th>GST</th>
              <th>Status</th>
              <th>PDF</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="8" align="center">
                  No invoices found
                </td>
              </tr>
            )}

            {data.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.invoice_number}</td>
                <td>{inv.candidate_name}</td>
                <td>{inv.invoice_date}</td>
                <td>{inv.billing_month}</td>
                <td>₹ {inv.total_amount}</td>
                <td>₹ {inv.gst_amount}</td>
                <td>{inv.status}</td>

                <td>
                  {inv.pdf_file ? (
                    <a href={inv.pdf_file} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SubAdminLayout>
  );
}