import {
  Box, Text,
} from '@chakra-ui/react';
import React from 'react';
import SingleLineInput from '../../../ui/forms/singleLineInput';

function ApplicantDetails({
  applicantName,
  setApplicantName,
  applicantEmail,
  setApplicantEmail,
  applicantNameError,
  setApplicantNameError,
  applicantEmailError,
  setApplicantEmailError,
  readOnly,
  grantRequiredFields,
}: {
  applicantName: string;
  setApplicantName: (applicantName: string) => void;
  applicantEmail: string;
  setApplicantEmail: (applicantEmail: string) => void;
  applicantNameError: boolean;
  setApplicantNameError: (applicantNameError: boolean) => void;
  applicantEmailError: boolean;
  setApplicantEmailError: (applicantEmailError: boolean) => void;
  readOnly?: boolean;
  grantRequiredFields: string[];
}) {
  return (
    <>
      <Text fontWeight="700" fontSize="16px" lineHeight="20px" color="#8850EA">
        Applicant Details
      </Text>
      <Box mt={6} />
      <SingleLineInput
        label="Applicant Name"
        placeholder="Nouns DAO"
        subtext="Full names are preferred."
        onChange={(e) => {
          if (applicantNameError) {
            setApplicantNameError(false);
          }
          setApplicantName(e.target.value);
        }}
        isError={applicantNameError}
        errorText="Required"
        value={applicantName}
        disabled={readOnly}
        visible={grantRequiredFields.includes('applicantName')}
      />
      <Box mt={6} />
      <SingleLineInput
        label="Applicant Email"
        placeholder="name@sample.com"
        value={applicantEmail}
        onChange={(e: any) => {
          if (applicantEmailError) {
            setApplicantEmailError(false);
          }
          setApplicantEmail(e.target.value);
        }}
        isError={applicantEmailError}
        errorText="Required"
        disabled={readOnly}
        visible={grantRequiredFields.includes('applicantEmail')}
        type="email"
      />
    </>
  );
}

ApplicantDetails.defaultProps = {
  readOnly: false,
};
export default ApplicantDetails;