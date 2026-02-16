-- US Law MCP — Pre-seeded requirement categories for cross-state comparison

INSERT INTO requirement_categories (category, subcategory, description) VALUES
('breach_notification', 'timeline', 'Time period to notify affected individuals'),
('breach_notification', 'definition', 'What constitutes a data breach'),
('breach_notification', 'scope', 'Who must comply with notification requirements'),
('breach_notification', 'notification_target', 'Who must be notified (consumers, AG, both)'),
('breach_notification', 'exemptions', 'Exemptions from notification requirements'),
('breach_notification', 'penalties', 'Penalties for non-compliance'),
('privacy_rights', 'right_to_know', 'Right to know what data is collected'),
('privacy_rights', 'right_to_delete', 'Right to request deletion of personal data'),
('privacy_rights', 'right_to_opt_out', 'Right to opt out of data sale/sharing'),
('privacy_rights', 'right_to_correct', 'Right to correct inaccurate personal data'),
('privacy_rights', 'right_to_portability', 'Right to receive data in portable format'),
('cybersecurity', 'security_requirements', 'Required security measures'),
('cybersecurity', 'risk_assessment', 'Risk assessment requirements'),
('cybersecurity', 'incident_response', 'Incident response plan requirements'),
('cybersecurity', 'encryption', 'Encryption requirements'),
('cybersecurity', 'vendor_management', 'Third-party vendor security requirements'),
('sector_specific', 'financial', 'Financial sector specific requirements'),
('sector_specific', 'healthcare', 'Healthcare sector specific requirements'),
('sector_specific', 'education', 'Education sector specific requirements'),
('sector_specific', 'insurance', 'Insurance sector specific requirements');
