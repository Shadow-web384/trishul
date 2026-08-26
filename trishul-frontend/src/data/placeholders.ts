// This file contains all placeholder texts and labels for the application.

export const PLACEHOLDERS = {
  HOME_INTRO: "Trishul is an AI-assisted MPLADS monitoring and investigation platform designed to detect anomalous project patterns and prioritize risks with explainable intelligence.",
  FAQ: [
    {
      question: "What is Trishul?",
      answer: "Trishul is an AI-assisted monitoring and investigation platform developed for the MPLADS scheme. It is designed to detect suspicious or anomalous project patterns and prioritize projects requiring attention. By providing explainable risk scores and AI-generated recommended actions, it shifts monitoring from manual and reactive to proactive and data-driven."
    },
    {
      question: "How is the data collected?",
      answer: "Trishul ingests and processes both structured and unstructured data from multiple official sources. This includes digital records from e-SAKSHI and financial transaction data from the Public Financial Management System (PFMS). It also analyzes geo-tagged photos and contractor documents to detect discrepancies between financial claims and physical progress."
    },
    {
      question: "What do the risk scores mean?",
      answer: "The system generates an overall risk score ranging from 0 to 100, which categorizes projects into LOW, MEDIUM, HIGH, or CRITICAL severity levels. This composite score is calculated by evaluating specific anomaly signals, including financial risk, operational delays, and compliance issues. When an alert is flagged, the platform provides exact evidence—such as cost overruns or progress mismatches—to explain why the score was assigned."
    },
    {
      question: "Who has access to this data?",
      answer: "The platform features role-based access designed for different levels of governance. Members of Parliament (MPs) can view projects and risks within their specific constituency scope. District Authorities manage district-wide project investigations and inspections, while State Authorities and the Ministry have higher-level oversight to monitor aggregate risks, fund utilization, and cross-state trends"
    }
  ],
  CONTACT_US: {
    NAME: "Aarnav jaiswal",
    EMAIL: "trishul@gmail.com",
    PHONE: "123456789"
  },
  KNOW_YOUR_SOURCE: [
    { label: "e-Sakshi ", url: "https://en.vikaspedia.in/viewcontent/e-governance/online-citizen-services/mplads–esakshi-web-portal?lgn=en" },
    { label: "PFMS ", url: "https://pfms.nic.in/Home.aspx" }
  ],
  FOOTER_RESTRICTED: "Prototype \u2014 restricted use, not for the general public.",
  BUTTON_ENTER_DASHBOARD: "Enter Dashboard",
  BUTTON_INVESTIGATE_AI: "Investigate with AI",
  BUTTON_VIEW_INVESTIGATION: "View Investigation",
  BUTTON_SCHEDULE_INSPECTION: "Schedule Inspection",
  BUTTON_VERIFY_EXPENDITURE: "Verify Expenditure",
  BUTTON_REVIEW_CONTRACTOR: "Review Contractor"
};
