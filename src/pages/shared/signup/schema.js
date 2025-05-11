import * as yup from "yup";

export const SignupSchema = yup.object().shape({
  fName: yup.string().required("Please enter your first name"),
  mName: yup.string().required("Please enter your middle name"),
  lName: yup.string().required("Please enter your last name"),
  email: yup.string().email().required("Please enter your email"),
  password: yup.string().required("Please enter your password"),
  
  bloodType: yup.string().required("Please enter your bloodType"),
  weight: yup.number().required("Please enter your body weight"),
  height: yup.number().required("Please enter your height"),
  
  dateOfBirth: yup.date().required("Please enter your date of birth"),
});

export const DoctorSignupSchema = yup.object().shape({
  fullName: yup.string().required("Please enter your full name"),
  occupation: yup.string().required("Please enter your occupation"),
  email: yup.string().email().required("Please enter your email"),
  password: yup.string().required("Please enter your password"),
  confirmPassword: yup.string().required("Please enter your password"),
  phoneNumber: yup
    .string()
    .required("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
});
