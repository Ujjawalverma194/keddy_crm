

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute, { GuestRoute } from "./pages/components/ProtectedRoute";
import { initializeAuthForAppStartup } from "./pages/components/authSession";

import SubAdminDashboard from "./pages/sub_admin/SubAdminDashboard";
import CentralAdminDashboard from "./pages/central_admin/CentralAdminDashboard";
import EmployeeDashboard from "./pages/emplyee_portal/EmployeeDashboard";
import EmployeeTeamSubmissions from "./pages/emplyee_portal/TeamSubmissions";

// ================= Vendor =================
import UserVendorManagement from "./pages/emplyee_portal/UserVendorManagement";
import AddVendor from "./pages/emplyee_portal/AddVendor";
import VendorView from "./pages/emplyee_portal/VendorView";
import DocViewer from "./pages/emplyee_portal/DocViewer";
import EditVendor from "./pages/emplyee_portal/EditVendor";

// ================= Client =================
import ClientList from "./pages/emplyee_portal/ClientList";
import AddClient from "./pages/emplyee_portal/AddClient";
import UpdateClient from "./pages/emplyee_portal/UpdateClient";
import EmployeeViewClient from "./pages/emplyee_portal/ClientView";

// ================= Candidate =================
import AddCandidate from "./pages/emplyee_portal/AddCandidate";
import CandidateList from "./pages/emplyee_portal/CandidateList";
import ViewCandidate from "./pages/emplyee_portal/ViewCandidate";
import UpdateCandidate from "./pages/emplyee_portal/UpdateCandidate";
import UserCandidatelist from "./pages/emplyee_portal/UserCandidateList";
import SubmittedProfiles from "./pages/emplyee_portal/SubmittedProfiles";

// ================= Pool =================
import PoolSelect from "./pages/emplyee_portal/Pool";
import VendorManagement from "./pages/emplyee_portal/VendorManagement";

// ===================Sub-Admin============================
import AllCandidateList from "./pages/sub_admin/allCandidateList";
import AllVendorList from "./pages/sub_admin/AllVendorList";
import SubAdminAddVendor from "./pages/sub_admin/subadminAddVendor";
import EditVendorSubAdmin from "./pages/sub_admin/EditVendor";
import SubAdminAddCandidate from "./pages/sub_admin/SubAdminAddCandidate";
import SubAdminViewCandidate from "./pages/sub_admin/SubAdminViewCandidate";
import SubAdminEditCandidate from "./pages/sub_admin/SubAdminEditCandidate";
import VendorViewSubAdmin from "./pages/sub_admin/VendorView";
import SubAdminClientList from "./pages/sub_admin/ClientList";
import SubAdminAddClient from "./pages/sub_admin/AddClient";
import SubAdminDocView from "./pages/sub_admin/DocViewer";
import SubAdminTeamManage from "./pages/sub_admin/TeamManage";
import AddUser from "./pages/sub_admin/AddUser";
import SubAdminUserDetail from "./pages/sub_admin/SubAdminUserDetail";
import SubAdminUserUpdate from "./pages/sub_admin/SubAdminUserUpdate";

import SubAdminClientView from "./pages/sub_admin/ClientView";
import SubadminTotalSubmittedProfiles from "./pages/sub_admin/TotalSubmittedProfiles";
import SubadminTotalOnbording from "./pages/sub_admin/TotalOnbording";
import SubadminTodaysSubmittedProfiles from "./pages/sub_admin/TodaysSubmittedProfiles";
import SubadminTodaysNewProfiles from "./pages/sub_admin/TodaysNewProfiles";
import SubadminPipeline from "./pages/sub_admin/Pipeline";
import OffboardedProfiles from "./pages/sub_admin/OffboardedProfiles";

// -------Invoice---
import SubadminCreateInvoice from "./pages/sub_admin/invoice/CreateInvoice";
import SubadminInvoicePreview from "./pages/sub_admin/invoice/InvoicePreview";
import SubadminInvoices from "./pages/sub_admin/invoice/InvoiceList";
import SubadminSettings from "./pages/sub_admin/invoice/CompanySettingsView";
import SubadminSettingsEdit from "./pages/sub_admin/invoice/CompanySettingsEdit";
import SubadminEditInvoice from "./pages/sub_admin/invoice/EditInvoice";
import CandidateInvoiceHistory from "./pages/sub_admin/invoice/CandidateHistory";
import SubadminUpdateClient from "./pages/sub_admin/Updateclient";

// ========================================================

import AccountsDashboard from "./pages/Accounts/AccountsDashboard";
import FinanceSettings from "./pages/Accounts/FinanceSettingsPage";
import FinanceList from "./pages/Accounts/FinanceListView";
import CreateInvoice from "./pages/Accounts/CreateInvoicePage";
import AllInvoices from "./pages/Accounts/InvoiceListPage";
import EditInvoice from "./pages/Accounts/Editinvoicepage";

// ========= Requirements ===============
import RequirementList from "./pages/emplyee_portal/Requirement/RequirementsList";
import RequirementCreate from "./pages/emplyee_portal/Requirement/RequirementCreate";
import RequirementUpdate from "./pages/emplyee_portal/Requirement/RequirementUpdate";
import RequirementView from "./pages/emplyee_portal/Requirement/RequirementView";
import EmpMyRequirements from "./pages/emplyee_portal/Requirement/MyRequirements";

import SubAdminRequirementList from "./pages/sub_admin/Requirement/SubRequirementsList";
import SubAdminRequirementCreate from "./pages/sub_admin/Requirement/SubRequirementCreate";
import SubAdminRequirementUpdate from "./pages/sub_admin/Requirement/SubRequirementUpdate";
import SubAdminRequirementView from "./pages/sub_admin/Requirement/SubRequirementView";
import SubAdminMyRequirements from "./pages/sub_admin/Requirement/SubMyRequirements";

// ========AttedanceDashboard============EMPLOYEE=====
import AttendanceDashboard from "./pages/emplyee_portal/Attendance/Attendancedashboard";
import AttendanceBoard from "./pages/emplyee_portal/Attendance/Attendanceboard";
import MyMonthly from "./pages/emplyee_portal/Attendance/Mymonthly";

// ===============AttedanceDashboard=====SUBADMIN======
import TeamReports from "./pages/sub_admin/Attendance/TeamReports";

const ROLES = {
    EMPLOYEE: "EMPLOYEE",
    SUB_ADMIN: "SUB_ADMIN",
    CENTRAL_ADMIN: "CENTRAL_ADMIN",
    ACCOUNTANT: "ACCOUNTANT",
};

let didAuthStartupCheck = false;

function runAuthStartupCheck() {
    if (!didAuthStartupCheck) {
        initializeAuthForAppStartup();
        didAuthStartupCheck = true;
    }
}

function App() {
    runAuthStartupCheck();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

                <Route path="/employee" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmployeeDashboard /></ProtectedRoute>} />
                <Route path="/employee/TeamSubmissions" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmployeeTeamSubmissions /></ProtectedRoute>} />

                <Route path="/employee/candidates/add" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AddCandidate /></ProtectedRoute>} />
                <Route path="/employee/candidates" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><CandidateList /></ProtectedRoute>} />
                <Route path="/employee/candidate/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><ViewCandidate /></ProtectedRoute>} />
                <Route path="/employee/candidate/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UpdateCandidate /></ProtectedRoute>} />
                <Route path="/employee/user-candidates" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UserCandidatelist /></ProtectedRoute>} />
                <Route path="/employee/submitted-profiles" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><SubmittedProfiles /></ProtectedRoute>} />

                <Route path="/employee/vendors" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><VendorManagement /></ProtectedRoute>} />
                <Route path="/employee/user-vendors" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UserVendorManagement /></ProtectedRoute>} />
                <Route path="/employee/pool" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PoolSelect /></ProtectedRoute>} />

                <Route path="/employee/vendor/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><VendorView /></ProtectedRoute>} />
                <Route path="/employee/vendor/doc-view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><DocViewer /></ProtectedRoute>} />
                <Route path="/employee/vendor/add" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AddVendor /></ProtectedRoute>} />
                <Route path="/employee/vendor/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EditVendor /></ProtectedRoute>} />

                <Route path="/employee/clients" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><ClientList /></ProtectedRoute>} />
                <Route path="/employee/client/add" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AddClient /></ProtectedRoute>} />
                <Route path="/employee/client/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmployeeViewClient /></ProtectedRoute>} />
                <Route path="/employee/client/update/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UpdateClient /></ProtectedRoute>} />

                <Route path="/employee/attendance" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AttendanceDashboard /></ProtectedRoute>} />
                <Route path="/employee/attendance/board" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AttendanceBoard /></ProtectedRoute>} />
                <Route path="/employee/attendance/monthly" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><MyMonthly /></ProtectedRoute>} />

                <Route path="/employee/requirements" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementList /></ProtectedRoute>} />
                <Route path="/employee/requirement/create" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementCreate /></ProtectedRoute>} />
                <Route path="/employee/requirement/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementUpdate /></ProtectedRoute>} />
                <Route path="/employee/requirement/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementView /></ProtectedRoute>} />
                <Route path="/employee/requirements/my" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmpMyRequirements /></ProtectedRoute>} />

                <Route path="/sub-admin" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminDashboard /></ProtectedRoute>} />
                <Route path="/sub-admin/all-candidates" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><AllCandidateList /></ProtectedRoute>} />
                <Route path="/sub-admin/all-Vendors" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><AllVendorList /></ProtectedRoute>} />
                <Route path="/sub-admin/add-vendor" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminAddVendor /></ProtectedRoute>} />
                <Route path="/sub-admin/edit-vendor/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><EditVendorSubAdmin /></ProtectedRoute>} />
                <Route path="/sub-admin/add-candidate" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminAddCandidate /></ProtectedRoute>} />
                <Route path="/sub-admin/candidate/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminViewCandidate /></ProtectedRoute>} />
                <Route path="/sub-admin/candidate/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminEditCandidate /></ProtectedRoute>} />
                <Route path="/sub-admin/vendor/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><VendorViewSubAdmin /></ProtectedRoute>} />
                <Route path="/sub-admin/clients" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminClientList /></ProtectedRoute>} />
                <Route path="/sub-admin/client/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminUpdateClient /></ProtectedRoute>} />
                <Route path="/sub-admin/client/add" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminAddClient /></ProtectedRoute>} />
                <Route path="/sub-admin/vendor/doc-view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminDocView /></ProtectedRoute>} />
                <Route path="/sub-admin/team-manage" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminTeamManage /></ProtectedRoute>} />
                <Route path="/sub-admin/add-user" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><AddUser /></ProtectedRoute>} />
                <Route path="/sub-admin/user/detail/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminUserDetail /></ProtectedRoute>} />
                <Route path="/sub-admin/user/update/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminUserUpdate /></ProtectedRoute>} />
                <Route path="/sub-admin/client/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminClientView /></ProtectedRoute>} />
                <Route path="/sub-admin/total-submitted-profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTotalSubmittedProfiles /></ProtectedRoute>} />
                <Route path="/sub-admin/total-onbording" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTotalOnbording /></ProtectedRoute>} />
                <Route path="/sub-admin/todays-submitted-profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTodaysSubmittedProfiles /></ProtectedRoute>} />
                <Route path="/sub-admin/todays-New-Profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTodaysNewProfiles /></ProtectedRoute>} />
                <Route path="/sub-admin/Pipeline" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminPipeline /></ProtectedRoute>} />
                <Route path="/sub-admin/pipeline" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminPipeline /></ProtectedRoute>} />
                <Route path="/sub-admin/offboarded-profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><OffboardedProfiles /></ProtectedRoute>} />

                <Route path="/sub-admin/requirements" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementList /></ProtectedRoute>} />
                <Route path="/sub-admin/requirement/create" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementCreate /></ProtectedRoute>} />
                <Route path="/sub-admin/requirement/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementUpdate /></ProtectedRoute>} />
                <Route path="/sub-admin/requirement/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementView /></ProtectedRoute>} />
                <Route path="/sub-admin/requirements/my" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminMyRequirements /></ProtectedRoute>} />

                <Route path="/sub-admin/create-invoice" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminCreateInvoice /></ProtectedRoute>} />
                <Route path="/sub-admin/invoice/preview/:invoice_id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminInvoicePreview /></ProtectedRoute>} />
                <Route path="/sub-admin/invoices" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminInvoices /></ProtectedRoute>} />
                <Route path="/sub-admin/invoice/settings" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminSettings /></ProtectedRoute>} />
                <Route path="/sub-admin/invoice/settings/edit" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminSettingsEdit /></ProtectedRoute>} />
                <Route path="/sub-admin/invoice/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminEditInvoice /></ProtectedRoute>} />
                <Route path="/sub-admin/invoice/candidate-history/:candidateId" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><CandidateInvoiceHistory /></ProtectedRoute>} />

                <Route path="/sub-admin/team-reports" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><TeamReports /></ProtectedRoute>} />

                <Route path="/accounts" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><AccountsDashboard /></ProtectedRoute>} />
                <Route path="/accounts/settings" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><FinanceSettings /></ProtectedRoute>} />
                <Route path="/accounts/finance-overview" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><FinanceList /></ProtectedRoute>} />
                <Route path="/accounts/create-invoice" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><CreateInvoice /></ProtectedRoute>} />
                <Route path="/accounts/all-invoices" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><AllInvoices /></ProtectedRoute>} />
                <Route path="/accounts/invoice/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><EditInvoice /></ProtectedRoute>} />

                <Route path="/central-admin" element={<ProtectedRoute allowedRoles={[ROLES.CENTRAL_ADMIN]}><CentralAdminDashboard /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;




// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// import Login from "./pages/Login";
// import Register from "./pages/Register";

// import ProtectedRoute, { GuestRoute } from "./pages/components/ProtectedRoute";

// import SubAdminDashboard from "./pages/sub_admin/SubAdminDashboard";
// import CentralAdminDashboard from "./pages/central_admin/CentralAdminDashboard";
// import EmployeeDashboard from "./pages/emplyee_portal/EmployeeDashboard";
// import EmployeeTeamSubmissions from "./pages/emplyee_portal/TeamSubmissions";

// // ================= Vendor =================
// import UserVendorManagement from "./pages/emplyee_portal/UserVendorManagement";
// import AddVendor from "./pages/emplyee_portal/AddVendor";
// import VendorView from "./pages/emplyee_portal/VendorView";
// import DocViewer from "./pages/emplyee_portal/DocViewer";
// import EditVendor from "./pages/emplyee_portal/EditVendor";

// // ================= Client =================
// import ClientList from "./pages/emplyee_portal/ClientList";
// import AddClient from "./pages/emplyee_portal/AddClient";
// import UpdateClient from "./pages/emplyee_portal/UpdateClient";
// import EmployeeViewClient from "./pages/emplyee_portal/ClientView";
// // ================= Candidate =================
// import AddCandidate from "./pages/emplyee_portal/AddCandidate";
// import CandidateList from "./pages/emplyee_portal/CandidateList";
// import ViewCandidate from "./pages/emplyee_portal/ViewCandidate";
// import UpdateCandidate from "./pages/emplyee_portal/UpdateCandidate";
// import UserCandidatelist from "./pages/emplyee_portal/UserCandidateList";
// import SubmittedProfiles from "./pages/emplyee_portal/SubmittedProfiles";

// // ================= Pool =================
// import PoolSelect from "./pages/emplyee_portal/Pool";
// import VendorManagement from "./pages/emplyee_portal/VendorManagement";

// // ===================Sub-Admin============================
// import AllCandidateList from "./pages/sub_admin/allCandidateList";
// import AllVendorList from "./pages/sub_admin/AllVendorList";
// import SubAdminAddVendor from "./pages/sub_admin/subadminAddVendor";
// import EditVendorSubAdmin from "./pages/sub_admin/EditVendor";
// import SubAdminAddCandidate from "./pages/sub_admin/SubAdminAddCandidate";
// import SubAdminViewCandidate from "./pages/sub_admin/SubAdminViewCandidate";
// import SubAdminEditCandidate from "./pages/sub_admin/SubAdminEditCandidate";
// import VendorViewSubAdmin from "./pages/sub_admin/VendorView";
// import SubAdminClientList from "./pages/sub_admin/ClientList";
// import ViewClient from "./pages/sub_admin/ViewClient";
// import SubAdminAddClient from "./pages/sub_admin/AddClient";
// import SubAdminDocView from "./pages/sub_admin/DocViewer";
// import SubAdminTeamManage from "./pages/sub_admin/TeamManage";
// import AddUser from "./pages/sub_admin/AddUser";
// import SubAdminUserDetail from "./pages/sub_admin/SubAdminUserDetail";
// import SubAdminUserUpdate from "./pages/sub_admin/SubAdminUserUpdate";

// import SubAdminClientView from "./pages/sub_admin/ClientView";
// import SubadminTotalSubmittedProfiles from "./pages/sub_admin/TotalSubmittedProfiles";
// import SubadminTotalOnbording from "./pages/sub_admin/TotalOnbording";
// import SubadminTodaysSubmittedProfiles from "./pages/sub_admin/TodaysSubmittedProfiles";
// import SubadminTodaysNewProfiles from "./pages/sub_admin/TodaysNewProfiles";
// import SubadminPipeline from "./pages/sub_admin/Pipeline";
// import OffboardedProfiles from "./pages/sub_admin/OffboardedProfiles";

// // -------Invoice---
// import SubadminCreateInvoice from "./pages/sub_admin/invoice/CreateInvoice";
// import SubadminInvoicePreview from "./pages/sub_admin/invoice/InvoicePreview";
// import SubadminInvoices from "./pages/sub_admin/invoice/InvoiceList";
// import SubadminSettings from "./pages/sub_admin/invoice/CompanySettingsView";
// import SubadminSettingsEdit from "./pages/sub_admin/invoice/CompanySettingsEdit";
// import SubadminEditInvoice from "./pages/sub_admin/invoice/EditInvoice";
// import CandidateInvoiceHistory from "./pages/sub_admin/invoice/CandidateHistory";
// import SubadminUpdateClient from "./pages/sub_admin/Updateclient";

// // ========================================================

// import AccountsDashboard from "./pages/Accounts/AccountsDashboard";
// import FinanceSettings from "./pages/Accounts/FinanceSettingsPage";
// import FinanceList from "./pages/Accounts/FinanceListView";
// import CreateInvoice from "./pages/Accounts/CreateInvoicePage";
// import AllInvoices from "./pages/Accounts/InvoiceListPage";
// import EditInvoice from "./pages/Accounts/Editinvoicepage";
// // ========================================================


// // ========= Requirements ===============
// import RequirementList from "./pages/emplyee_portal/Requirement/RequirementsList";
// import RequirementCreate from "./pages/emplyee_portal/Requirement/RequirementCreate";
// import RequirementUpdate from "./pages/emplyee_portal/Requirement/RequirementUpdate";
// import RequirementView from "./pages/emplyee_portal/Requirement/RequirementView";
// import EmpMyRequirements from "./pages/emplyee_portal/Requirement/MyRequirements";
// // Sub-admin Requirement List
// import SubAdminRequirementList from "./pages/sub_admin/Requirement/SubRequirementsList";
// import SubAdminRequirementCreate from "./pages/sub_admin/Requirement/SubRequirementCreate";
// import SubAdminRequirementUpdate from "./pages/sub_admin/Requirement/SubRequirementUpdate";
// import SubAdminRequirementView from "./pages/sub_admin/Requirement/SubRequirementView";
// import SubAdminMyRequirements from "./pages/sub_admin/Requirement/SubMyRequirements";

// // ========AttedanceDashboard============EMPLOYEE=====
// import AttendanceDashboard from "./pages/emplyee_portal/Attendance/Attendancedashboard";
// import AttendanceBoard     from "./pages/emplyee_portal/Attendance/Attendanceboard";
// import MyMonthly           from "./pages/emplyee_portal/Attendance/Mymonthly";

// // ===============AttedanceDashboard=====SUBADMIN======
// import TeamReports from "./pages/sub_admin/Attendance/TeamReports";

// // Role constants — single source of truth
// const ROLES = {
//     EMPLOYEE: "EMPLOYEE",
//     SUB_ADMIN: "SUB_ADMIN",
//     CENTRAL_ADMIN: "CENTRAL_ADMIN",
//     ACCOUNTANT: "ACCOUNTANT",
// };

// function App() {
//     return (
//         <BrowserRouter>
//             <Routes>

//                 {/* Public Routes — redirect to dashboard if already logged in */}
//                 <Route path="/" element={<GuestRoute><Login /></GuestRoute>} />
//                 <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

//                 {/* ===== EMPLOYEE ROUTES ===== */}
//                 <Route path="/employee" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmployeeDashboard /></ProtectedRoute>} />
//                 <Route path="/employee/TeamSubmissions" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmployeeTeamSubmissions /></ProtectedRoute>} />

//                 <Route path="/employee/candidates/add" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AddCandidate /></ProtectedRoute>} />
//                 <Route path="/employee/candidates" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><CandidateList /></ProtectedRoute>} />
//                 <Route path="/employee/candidate/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><ViewCandidate /></ProtectedRoute>} />
//                 <Route path="/employee/candidate/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UpdateCandidate /></ProtectedRoute>} />
//                 <Route path="/employee/user-candidates" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UserCandidatelist /></ProtectedRoute>} />
//                 <Route path="/employee/submitted-profiles" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><SubmittedProfiles /></ProtectedRoute>} />

//                 <Route path="/employee/vendors" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><VendorManagement /></ProtectedRoute>} />
//                 <Route path="/employee/user-vendors" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UserVendorManagement /></ProtectedRoute>} />
//                 <Route path="/employee/pool" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PoolSelect /></ProtectedRoute>} />

//                 <Route path="/employee/vendor/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><VendorView /></ProtectedRoute>} />
//                 <Route path="/employee/vendor/doc-view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><DocViewer /></ProtectedRoute>} />
//                 <Route path="/employee/vendor/add" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AddVendor /></ProtectedRoute>} />
//                 <Route path="/employee/vendor/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EditVendor /></ProtectedRoute>} />

//                 <Route path="/employee/clients" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><ClientList /></ProtectedRoute>} />
//                 <Route path="/employee/client/add" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AddClient /></ProtectedRoute>} />
//                 <Route path="/employee/client/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmployeeViewClient /></ProtectedRoute>} />
//                 <Route path="/employee/client/update/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><UpdateClient /></ProtectedRoute>} />

//                 {/* Employee Attendance */}
//                 <Route path="/employee/attendance" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AttendanceDashboard /></ProtectedRoute>} />
//                 <Route path="/employee/attendance/board" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><AttendanceBoard /></ProtectedRoute>} />
//                 <Route path="/employee/attendance/monthly" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><MyMonthly /></ProtectedRoute>} />

//                 {/* Employee Requirements */}
//                 <Route path="/employee/requirements" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementList /></ProtectedRoute>} />
//                 <Route path="/employee/requirement/create" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementCreate /></ProtectedRoute>} />
//                 <Route path="/employee/requirement/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementUpdate /></ProtectedRoute>} />
//                 <Route path="/employee/requirement/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><RequirementView /></ProtectedRoute>} />
//                 <Route path="/employee/requirements/my" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><EmpMyRequirements /></ProtectedRoute>} />

//                 {/* ===== SUB-ADMIN ROUTES ===== */}
//                 <Route path="/sub-admin" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminDashboard /></ProtectedRoute>} />
//                 <Route path="/sub-admin/all-candidates" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><AllCandidateList /></ProtectedRoute>} />
//                 <Route path="/sub-admin/all-Vendors" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><AllVendorList /></ProtectedRoute>} />
//                 <Route path="/sub-admin/add-vendor" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminAddVendor /></ProtectedRoute>} />
//                 <Route path="/sub-admin/edit-vendor/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><EditVendorSubAdmin /></ProtectedRoute>} />
//                 <Route path="/sub-admin/add-candidate" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminAddCandidate /></ProtectedRoute>} />
//                 <Route path="/sub-admin/candidate/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminViewCandidate /></ProtectedRoute>} />
//                 <Route path="/sub-admin/candidate/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminEditCandidate /></ProtectedRoute>} />
//                 <Route path="/sub-admin/vendor/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><VendorViewSubAdmin /></ProtectedRoute>} />
//                 <Route path="/sub-admin/clients" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminClientList /></ProtectedRoute>} />
//                 <Route path="/sub-admin/client/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminUpdateClient /></ProtectedRoute>} />
//                 <Route path="/sub-admin/client/add" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminAddClient /></ProtectedRoute>} />
//                 <Route path="/sub-admin/vendor/doc-view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminDocView /></ProtectedRoute>} />
//                 <Route path="/sub-admin/team-manage" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminTeamManage /></ProtectedRoute>} />
//                 <Route path="/sub-admin/add-user" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><AddUser /></ProtectedRoute>} />
//                 <Route path="/sub-admin/user/detail/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminUserDetail /></ProtectedRoute>} />
//                 <Route path="/sub-admin/user/update/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminUserUpdate /></ProtectedRoute>} />
//                 <Route path="/sub-admin/client/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminClientView /></ProtectedRoute>} />
//                 <Route path="/sub-admin/total-submitted-profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTotalSubmittedProfiles /></ProtectedRoute>} />
//                 <Route path="/sub-admin/total-onbording" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTotalOnbording /></ProtectedRoute>} />
//                 <Route path="/sub-admin/todays-submitted-profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTodaysSubmittedProfiles /></ProtectedRoute>} />
//                 <Route path="/sub-admin/todays-New-Profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminTodaysNewProfiles /></ProtectedRoute>} />
//                 <Route path="/sub-admin/Pipeline" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminPipeline /></ProtectedRoute>} />
//                 <Route path="/sub-admin/pipeline" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminPipeline /></ProtectedRoute>} />
//                 <Route path="/sub-admin/offboarded-profiles" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><OffboardedProfiles /></ProtectedRoute>} />

//                 {/* Sub-admin Requirements */}
//                 <Route path="/sub-admin/requirements" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementList /></ProtectedRoute>} />
//                 <Route path="/sub-admin/requirement/create" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementCreate /></ProtectedRoute>} />
//                 <Route path="/sub-admin/requirement/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementUpdate /></ProtectedRoute>} />
//                 <Route path="/sub-admin/requirement/view/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminRequirementView /></ProtectedRoute>} />
//                 <Route path="/sub-admin/requirements/my" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubAdminMyRequirements /></ProtectedRoute>} />

//                 {/* Sub-admin Invoice */}
//                 <Route path="/sub-admin/create-invoice" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminCreateInvoice /></ProtectedRoute>} />
//                 <Route path="/sub-admin/invoice/preview/:invoice_id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminInvoicePreview /></ProtectedRoute>} />
//                 <Route path="/sub-admin/invoices" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminInvoices /></ProtectedRoute>} />
//                 <Route path="/sub-admin/invoice/settings" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminSettings /></ProtectedRoute>} />
//                 <Route path="/sub-admin/invoice/settings/edit" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminSettingsEdit /></ProtectedRoute>} />
//                 <Route path="/sub-admin/invoice/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><SubadminEditInvoice /></ProtectedRoute>} />
//                 <Route path="/sub-admin/invoice/candidate-history/:candidateId" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><CandidateInvoiceHistory /></ProtectedRoute>} />

//                 {/* Sub-admin Attendance */}
//                 <Route path="/sub-admin/team-reports" element={<ProtectedRoute allowedRoles={[ROLES.SUB_ADMIN]}><TeamReports /></ProtectedRoute>} />

//                 {/* ===== ACCOUNTS ROUTES ===== */}
//                 <Route path="/accounts" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><AccountsDashboard /></ProtectedRoute>} />
//                 <Route path="/accounts/settings" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><FinanceSettings /></ProtectedRoute>} />
//                 <Route path="/accounts/finance-overview" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><FinanceList /></ProtectedRoute>} />
//                 <Route path="/accounts/create-invoice" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><CreateInvoice /></ProtectedRoute>} />
//                 <Route path="/accounts/all-invoices" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><AllInvoices /></ProtectedRoute>} />
//                 <Route path="/accounts/invoice/edit/:id" element={<ProtectedRoute allowedRoles={[ROLES.ACCOUNTANT]}><EditInvoice /></ProtectedRoute>} />

//                 {/* ===== CENTRAL ADMIN ROUTES ===== */}
//                 <Route path="/central-admin" element={<ProtectedRoute allowedRoles={[ROLES.CENTRAL_ADMIN]}><CentralAdminDashboard /></ProtectedRoute>} />

//                 {/* Catch-all: redirect any unknown route to login */}
//                 <Route path="*" element={<Navigate to="/" replace />} />

//             </Routes>
//         </BrowserRouter>
//     );
// }

// export default App;