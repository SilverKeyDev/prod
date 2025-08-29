// Shared validation logic for onboarding and personalization forms

import { OnboardingData, ValidationResult } from './types';

export const validateFormData = (formData: OnboardingData): ValidationResult => {
  const missingFields: string[] = [];
  const errors: string[] = [];

  // Demographics - Required fields
  if (!formData.age || formData.age <= 0) {
    missingFields.push("Age");
  }
  if (!formData.gender || formData.gender.trim() === "") {
    missingFields.push("Gender");
  }
  if (!formData.occupation || formData.occupation.trim() === "") {
    missingFields.push("Occupation");
  }
  if (!formData.pets || formData.pets.trim() === "") {
    missingFields.push("Pet ownership status");
  }

  // Financial - Required fields
  if (!formData.gross_income || formData.gross_income <= 0) {
    missingFields.push("Gross income");
  }
  if (!formData.home_budget || formData.home_budget <= 0) {
    missingFields.push("Home budget");
  }
  if (!formData.credit_score_range || formData.credit_score_range.trim() === "") {
    missingFields.push("Credit score range");
  }
  if (!formData.down_payment || formData.down_payment < 0) {
    missingFields.push("Down payment");
  }

  // Housing - Required fields
  if (!formData.preferred_housing_type || formData.preferred_housing_type.trim() === "") {
    missingFields.push("Preferred housing type");
  }
  if (!formData.preferred_bedrooms || formData.preferred_bedrooms <= 0) {
    missingFields.push("Preferred bedrooms");
  }
  if (!formData.preferred_bathrooms || formData.preferred_bathrooms <= 0) {
    missingFields.push("Preferred bathrooms");
  }

  // Location - Required fields
  if (!formData.walkability_importance || formData.walkability_importance.trim() === "") {
    missingFields.push("Walkability importance");
  }

  // Communication - Required fields
  if (!formData.communication_frequency || formData.communication_frequency.trim() === "") {
    missingFields.push("Communication frequency");
  }
  if (!formData.information_detail_level || formData.information_detail_level.trim() === "") {
    missingFields.push("Information detail level");
  }
  if (!formData.has_buyers_agent || formData.has_buyers_agent.trim() === "") {
    missingFields.push("Buyers agent status");
  }

  // Report Customization - At least one section must be selected
  if (!formData.report_section_priorities || formData.report_section_priorities.length === 0) {
    missingFields.push("At least one report section");
  }

  // Additional validation rules
  if (formData.down_payment && formData.home_budget && formData.down_payment > formData.home_budget) {
    errors.push("Down payment cannot be higher than home budget.");
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors
  };
};

export const validatePersonalizationData = (formData: OnboardingData): ValidationResult => {
  const missingFields: string[] = [];
  const errors: string[] = [];

  // Demographics - Required fields
  if (!formData.age || formData.age <= 0) {
    missingFields.push("Age");
  }
  if (!formData.gender || formData.gender.trim() === "") {
    missingFields.push("Gender");
  }
  if (!formData.occupation || formData.occupation.trim() === "") {
    missingFields.push("Occupation");
  }
  if (!formData.pets || formData.pets.trim() === "") {
    missingFields.push("Pet ownership status");
  }

  // Financial - Required fields
  if (!formData.gross_income || formData.gross_income <= 0) {
    missingFields.push("Gross income");
  }
  if (!formData.home_budget || formData.home_budget <= 0) {
    missingFields.push("Home budget");
  }
  if (!formData.credit_score_range || formData.credit_score_range.trim() === "") {
    missingFields.push("Credit score range");
  }
  if (!formData.down_payment || formData.down_payment < 0) {
    missingFields.push("Down payment");
  }

  // Housing - Required fields
  if (!formData.preferred_housing_type || formData.preferred_housing_type.trim() === "") {
    missingFields.push("Preferred housing type");
  }
  if (!formData.preferred_bedrooms || formData.preferred_bedrooms <= 0) {
    missingFields.push("Preferred bedrooms");
  }
  if (!formData.preferred_bathrooms || formData.preferred_bathrooms <= 0) {
    missingFields.push("Preferred bathrooms");
  }
  if (!formData.preferred_lot_size || formData.preferred_lot_size.trim() === "") {
    missingFields.push("Preferred lot size");
  }
  if (!formData.preferred_home_age || formData.preferred_home_age.trim() === "") {
    missingFields.push("Preferred home age");
  }
  if (!formData.renovation_preference || formData.renovation_preference.trim() === "") {
    missingFields.push("Renovation preference");
  }
  if (!formData.intended_property_use || formData.intended_property_use.trim() === "") {
    missingFields.push("Intended property use");
  }

  // Location - Required fields
  if (!formData.important_locations || formData.important_locations.length === 0) {
    missingFields.push("At least one important location");
  } else {
    // Validate each important location has required fields
    formData.important_locations.forEach((location, index) => {
      if (!location.name || location.name.trim() === "") {
        missingFields.push(`Important location ${index + 1} name`);
      }
      if (!location.address || location.address.trim() === "") {
        missingFields.push(`Important location ${index + 1} address`);
      }
      if (!location.commute_tolerance || location.commute_tolerance <= 0) {
        missingFields.push(`Important location ${index + 1} commute tolerance`);
      }
    });
  }
  
  if (!formData.walkability_importance || formData.walkability_importance.trim() === "") {
    missingFields.push("Walkability importance");
  }

  // Communication - Required fields
  if (!formData.communication_frequency || formData.communication_frequency.trim() === "") {
    missingFields.push("Communication frequency");
  }
  if (!formData.information_detail_level || formData.information_detail_level.trim() === "") {
    missingFields.push("Information detail level");
  }
  if (!formData.has_buyers_agent || formData.has_buyers_agent.trim() === "") {
    missingFields.push("Buyers agent status");
  }

  // Report Customization - At least one section must be selected
  if (!formData.report_section_priorities || formData.report_section_priorities.length === 0) {
    missingFields.push("At least one report section");
  }

  // Additional validation rules
  if (formData.down_payment && formData.home_budget && formData.down_payment > formData.home_budget) {
    errors.push("Down payment cannot be higher than home budget.");
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors
  };
};
