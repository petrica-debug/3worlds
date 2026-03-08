"""
Safety Data Sheet (SDS) Generator

Generates compliant 16-section SDS documents per REACH Annex II
(Commission Regulation (EU) 2020/878).

Uses Claude API for intelligent text generation with chemical context.
All outputs are Annex II compliant and available in 24 EU languages.

Usage:
    generator = SDSGenerator(api_key="...")
    sds = generator.generate(
        cas_number="50-00-0",
        classification=clp_result,  # From CLPClassifier
        use_conditions={"concentration": "37%", "form": "aqueous solution"}
    )
    sds.export_pdf("formaldehyde_sds.pdf")
"""

from dataclasses import dataclass, field
from typing import Optional


# The 16 mandatory SDS sections per Annex II
SDS_SECTIONS = [
    "Identification of the substance/mixture and of the company/undertaking",
    "Hazards identification",
    "Composition/information on ingredients",
    "First aid measures",
    "Firefighting measures",
    "Accidental release measures",
    "Handling and storage",
    "Exposure controls/personal protection",
    "Physical and chemical properties",
    "Stability and reactivity",
    "Toxicological information",
    "Ecological information",
    "Disposal considerations",
    "Transport information",
    "Regulatory information",
    "Other information",
]

SUPPORTED_LANGUAGES = [
    "en", "de", "fr", "nl", "it", "es", "pt", "el", "pl", "cs",
    "sk", "hu", "ro", "bg", "hr", "sl", "lt", "lv", "et", "fi",
    "sv", "da", "ga", "mt"
]


@dataclass
class SDSSection:
    """A single section of the Safety Data Sheet."""
    number: int
    title: str
    content: str
    subsections: list[dict] = field(default_factory=list)


@dataclass
class SafetyDataSheet:
    """Complete Safety Data Sheet document."""
    substance_name: str
    cas_number: str
    revision_date: str
    language: str
    sections: list[SDSSection]

    def export_pdf(self, path: str):
        """Export as PDF."""
        # TODO: Use ReportLab or WeasyPrint for PDF generation
        raise NotImplementedError

    def export_docx(self, path: str):
        """Export as Word document."""
        # TODO: Use python-docx for DOCX generation
        raise NotImplementedError

    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "substance_name": self.substance_name,
            "cas_number": self.cas_number,
            "revision_date": self.revision_date,
            "language": self.language,
            "sections": [
                {"number": s.number, "title": s.title, "content": s.content}
                for s in self.sections
            ]
        }


class SDSGenerator:
    """
    AI-powered Safety Data Sheet generator.

    Pipeline:
    1. Retrieve substance data (CLP classification, physical properties)
    2. Look up reference SDS from ECHA database (if available)
    3. Generate each section using Claude API with chemical context
    4. Validate against Annex II requirements
    5. Quality check: cross-reference H-statements with section content
    6. Optional: translate to target EU language
    """

    def __init__(self, anthropic_api_key: Optional[str] = None):
        self.api_key = anthropic_api_key
        # TODO: Initialize Anthropic client
        # TODO: Load SDS templates and guidance documents

    def generate(
        self,
        cas_number: str,
        classification: Optional[dict] = None,
        use_conditions: Optional[dict] = None,
        language: str = "en",
    ) -> SafetyDataSheet:
        """
        Generate a complete Safety Data Sheet.

        Args:
            cas_number: CAS registry number
            classification: Pre-computed CLP classification (optional)
            use_conditions: Specific use conditions (concentration, form, etc.)
            language: Target language (ISO 639-1 code)
        """
        # TODO: Implement generation pipeline
        raise NotImplementedError

    def _generate_section(self, section_num: int, context: dict) -> SDSSection:
        """Generate a single SDS section using Claude API."""
        # TODO: Build prompt with chemical context
        # Include: substance properties, classification, regulatory data
        # Use RAG to pull relevant guidance from ECHA documents
        pass

    def _validate_sds(self, sds: SafetyDataSheet) -> list[str]:
        """Validate SDS against Annex II requirements. Returns list of issues."""
        # TODO: Check completeness, consistency, H-statement alignment
        pass

    def translate(self, sds: SafetyDataSheet, target_lang: str) -> SafetyDataSheet:
        """Translate SDS to another EU language."""
        # TODO: Use Claude for domain-aware translation
        # Chemical terminology must be precise
        pass
