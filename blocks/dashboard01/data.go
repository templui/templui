package dashboard01

// Item represents one row of data.json.
type Item struct {
	ID          int
	Header      string
	SectionType string
	Status      string
	Target      string
	Limit       string
	Reviewer    string
}

// Data holds all rows of data.json verbatim.
var Data = []Item{
	{ID: 1, Header: "Cover page", SectionType: "Cover page", Status: "In Process", Target: "18", Limit: "5", Reviewer: "Eddie Lake"},
	{ID: 2, Header: "Table of contents", SectionType: "Table of contents", Status: "Done", Target: "29", Limit: "24", Reviewer: "Eddie Lake"},
	{ID: 3, Header: "Executive summary", SectionType: "Narrative", Status: "Done", Target: "10", Limit: "13", Reviewer: "Eddie Lake"},
	{ID: 4, Header: "Technical approach", SectionType: "Narrative", Status: "Done", Target: "27", Limit: "23", Reviewer: "Jamik Tashpulatov"},
	{ID: 5, Header: "Design", SectionType: "Narrative", Status: "In Process", Target: "2", Limit: "16", Reviewer: "Jamik Tashpulatov"},
	{ID: 6, Header: "Capabilities", SectionType: "Narrative", Status: "In Process", Target: "20", Limit: "8", Reviewer: "Jamik Tashpulatov"},
	{ID: 7, Header: "Integration with existing systems", SectionType: "Narrative", Status: "In Process", Target: "19", Limit: "21", Reviewer: "Jamik Tashpulatov"},
	{ID: 8, Header: "Innovation and Advantages", SectionType: "Narrative", Status: "Done", Target: "25", Limit: "26", Reviewer: "Assign reviewer"},
	{ID: 9, Header: "Overview of EMR's Innovative Solutions", SectionType: "Technical content", Status: "Done", Target: "7", Limit: "23", Reviewer: "Assign reviewer"},
	{ID: 10, Header: "Advanced Algorithms and Machine Learning", SectionType: "Narrative", Status: "Done", Target: "30", Limit: "28", Reviewer: "Assign reviewer"},
	{ID: 11, Header: "Adaptive Communication Protocols", SectionType: "Narrative", Status: "Done", Target: "9", Limit: "31", Reviewer: "Assign reviewer"},
	{ID: 12, Header: "Advantages Over Current Technologies", SectionType: "Narrative", Status: "Done", Target: "12", Limit: "0", Reviewer: "Assign reviewer"},
	{ID: 13, Header: "Past Performance", SectionType: "Narrative", Status: "Done", Target: "22", Limit: "33", Reviewer: "Assign reviewer"},
	{ID: 14, Header: "Customer Feedback and Satisfaction Levels", SectionType: "Narrative", Status: "Done", Target: "15", Limit: "34", Reviewer: "Assign reviewer"},
	{ID: 15, Header: "Implementation Challenges and Solutions", SectionType: "Narrative", Status: "Done", Target: "3", Limit: "35", Reviewer: "Assign reviewer"},
	{ID: 16, Header: "Security Measures and Data Protection Policies", SectionType: "Narrative", Status: "In Process", Target: "6", Limit: "36", Reviewer: "Assign reviewer"},
	{ID: 17, Header: "Scalability and Future Proofing", SectionType: "Narrative", Status: "Done", Target: "4", Limit: "37", Reviewer: "Assign reviewer"},
	{ID: 18, Header: "Cost-Benefit Analysis", SectionType: "Plain language", Status: "Done", Target: "14", Limit: "38", Reviewer: "Assign reviewer"},
	{ID: 19, Header: "User Training and Onboarding Experience", SectionType: "Narrative", Status: "Done", Target: "17", Limit: "39", Reviewer: "Assign reviewer"},
	{ID: 20, Header: "Future Development Roadmap", SectionType: "Narrative", Status: "Done", Target: "11", Limit: "40", Reviewer: "Assign reviewer"},
	{ID: 21, Header: "System Architecture Overview", SectionType: "Technical content", Status: "In Process", Target: "24", Limit: "18", Reviewer: "Maya Johnson"},
	{ID: 22, Header: "Risk Management Plan", SectionType: "Narrative", Status: "Done", Target: "15", Limit: "22", Reviewer: "Carlos Rodriguez"},
	{ID: 23, Header: "Compliance Documentation", SectionType: "Legal", Status: "In Process", Target: "31", Limit: "27", Reviewer: "Sarah Chen"},
	{ID: 24, Header: "API Documentation", SectionType: "Technical content", Status: "Done", Target: "8", Limit: "12", Reviewer: "Raj Patel"},
	{ID: 25, Header: "User Interface Mockups", SectionType: "Visual", Status: "In Process", Target: "19", Limit: "25", Reviewer: "Leila Ahmadi"},
	{ID: 26, Header: "Database Schema", SectionType: "Technical content", Status: "Done", Target: "22", Limit: "20", Reviewer: "Thomas Wilson"},
	{ID: 27, Header: "Testing Methodology", SectionType: "Technical content", Status: "In Process", Target: "17", Limit: "14", Reviewer: "Assign reviewer"},
	{ID: 28, Header: "Deployment Strategy", SectionType: "Narrative", Status: "Done", Target: "26", Limit: "30", Reviewer: "Eddie Lake"},
	{ID: 29, Header: "Budget Breakdown", SectionType: "Financial", Status: "In Process", Target: "13", Limit: "16", Reviewer: "Jamik Tashpulatov"},
	{ID: 30, Header: "Market Analysis", SectionType: "Research", Status: "Done", Target: "29", Limit: "32", Reviewer: "Sophia Martinez"},
	{ID: 31, Header: "Competitor Comparison", SectionType: "Research", Status: "In Process", Target: "21", Limit: "19", Reviewer: "Assign reviewer"},
	{ID: 32, Header: "Maintenance Plan", SectionType: "Technical content", Status: "Done", Target: "16", Limit: "23", Reviewer: "Alex Thompson"},
	{ID: 33, Header: "User Personas", SectionType: "Research", Status: "In Process", Target: "27", Limit: "24", Reviewer: "Nina Patel"},
	{ID: 34, Header: "Accessibility Compliance", SectionType: "Legal", Status: "Done", Target: "18", Limit: "21", Reviewer: "Assign reviewer"},
	{ID: 35, Header: "Performance Metrics", SectionType: "Technical content", Status: "In Process", Target: "23", Limit: "26", Reviewer: "David Kim"},
	{ID: 36, Header: "Disaster Recovery Plan", SectionType: "Technical content", Status: "Done", Target: "14", Limit: "17", Reviewer: "Jamik Tashpulatov"},
	{ID: 37, Header: "Third-party Integrations", SectionType: "Technical content", Status: "In Process", Target: "25", Limit: "28", Reviewer: "Eddie Lake"},
	{ID: 38, Header: "User Feedback Summary", SectionType: "Research", Status: "Done", Target: "20", Limit: "15", Reviewer: "Assign reviewer"},
	{ID: 39, Header: "Localization Strategy", SectionType: "Narrative", Status: "In Process", Target: "12", Limit: "19", Reviewer: "Maria Garcia"},
	{ID: 40, Header: "Mobile Compatibility", SectionType: "Technical content", Status: "Done", Target: "28", Limit: "31", Reviewer: "James Wilson"},
	{ID: 41, Header: "Data Migration Plan", SectionType: "Technical content", Status: "In Process", Target: "19", Limit: "22", Reviewer: "Assign reviewer"},
	{ID: 42, Header: "Quality Assurance Protocols", SectionType: "Technical content", Status: "Done", Target: "30", Limit: "33", Reviewer: "Priya Singh"},
	{ID: 43, Header: "Stakeholder Analysis", SectionType: "Research", Status: "In Process", Target: "11", Limit: "14", Reviewer: "Eddie Lake"},
	{ID: 44, Header: "Environmental Impact Assessment", SectionType: "Research", Status: "Done", Target: "24", Limit: "27", Reviewer: "Assign reviewer"},
	{ID: 45, Header: "Intellectual Property Rights", SectionType: "Legal", Status: "In Process", Target: "17", Limit: "20", Reviewer: "Sarah Johnson"},
	{ID: 46, Header: "Customer Support Framework", SectionType: "Narrative", Status: "Done", Target: "22", Limit: "25", Reviewer: "Jamik Tashpulatov"},
	{ID: 47, Header: "Version Control Strategy", SectionType: "Technical content", Status: "In Process", Target: "15", Limit: "18", Reviewer: "Assign reviewer"},
	{ID: 48, Header: "Continuous Integration Pipeline", SectionType: "Technical content", Status: "Done", Target: "26", Limit: "29", Reviewer: "Michael Chen"},
	{ID: 49, Header: "Regulatory Compliance", SectionType: "Legal", Status: "In Process", Target: "13", Limit: "16", Reviewer: "Assign reviewer"},
	{ID: 50, Header: "User Authentication System", SectionType: "Technical content", Status: "Done", Target: "28", Limit: "31", Reviewer: "Eddie Lake"},
	{ID: 51, Header: "Data Analytics Framework", SectionType: "Technical content", Status: "In Process", Target: "21", Limit: "24", Reviewer: "Jamik Tashpulatov"},
	{ID: 52, Header: "Cloud Infrastructure", SectionType: "Technical content", Status: "Done", Target: "16", Limit: "19", Reviewer: "Assign reviewer"},
	{ID: 53, Header: "Network Security Measures", SectionType: "Technical content", Status: "In Process", Target: "29", Limit: "32", Reviewer: "Lisa Wong"},
	{ID: 54, Header: "Project Timeline", SectionType: "Planning", Status: "Done", Target: "14", Limit: "17", Reviewer: "Eddie Lake"},
	{ID: 55, Header: "Resource Allocation", SectionType: "Planning", Status: "In Process", Target: "27", Limit: "30", Reviewer: "Assign reviewer"},
	{ID: 56, Header: "Team Structure and Roles", SectionType: "Planning", Status: "Done", Target: "20", Limit: "23", Reviewer: "Jamik Tashpulatov"},
	{ID: 57, Header: "Communication Protocols", SectionType: "Planning", Status: "In Process", Target: "15", Limit: "18", Reviewer: "Assign reviewer"},
	{ID: 58, Header: "Success Metrics", SectionType: "Planning", Status: "Done", Target: "30", Limit: "33", Reviewer: "Eddie Lake"},
	{ID: 59, Header: "Internationalization Support", SectionType: "Technical content", Status: "In Process", Target: "23", Limit: "26", Reviewer: "Jamik Tashpulatov"},
	{ID: 60, Header: "Backup and Recovery Procedures", SectionType: "Technical content", Status: "Done", Target: "18", Limit: "21", Reviewer: "Assign reviewer"},
	{ID: 61, Header: "Monitoring and Alerting System", SectionType: "Technical content", Status: "In Process", Target: "25", Limit: "28", Reviewer: "Daniel Park"},
	{ID: 62, Header: "Code Review Guidelines", SectionType: "Technical content", Status: "Done", Target: "12", Limit: "15", Reviewer: "Eddie Lake"},
	{ID: 63, Header: "Documentation Standards", SectionType: "Technical content", Status: "In Process", Target: "27", Limit: "30", Reviewer: "Jamik Tashpulatov"},
	{ID: 64, Header: "Release Management Process", SectionType: "Planning", Status: "Done", Target: "22", Limit: "25", Reviewer: "Assign reviewer"},
	{ID: 65, Header: "Feature Prioritization Matrix", SectionType: "Planning", Status: "In Process", Target: "19", Limit: "22", Reviewer: "Emma Davis"},
	{ID: 66, Header: "Technical Debt Assessment", SectionType: "Technical content", Status: "Done", Target: "24", Limit: "27", Reviewer: "Eddie Lake"},
	{ID: 67, Header: "Capacity Planning", SectionType: "Planning", Status: "In Process", Target: "21", Limit: "24", Reviewer: "Jamik Tashpulatov"},
	{ID: 68, Header: "Service Level Agreements", SectionType: "Legal", Status: "Done", Target: "26", Limit: "29", Reviewer: "Assign reviewer"},
}
