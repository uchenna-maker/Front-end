import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoginSchema } from "./schema.js";
import { GButton, GTextField } from "../../../components/index.js";
import { useApiSend } from "../../../hooks/useApi.js";
import { loginUser } from "../../../urls/auth.js";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../../../redux/reducers/authSlice.js";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";



export const PatientLogin = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(LoginSchema),
  });


  const { mutate, isPending } = useApiSend(
    loginUser,
    (data) => {
      

      dispatch(setCurrentUser(data));
      Cookies.set("token", data?.token);
      navigate("/");
    },
    () => {
      toast.error("Login failed");
    }
  )

  const onSubmit = (data) => {
    mutate(data);
  };
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={"w-full flex flex-col gap-4"}
    >
      <GTextField
        label="Email"
        name="email"
        placeholder={"Email Address"}
        register={register}
        error={errors.email}
        errorText={errors.email?.message}
      />

      <GTextField
        label="Password"
        name="password"
        inputType="password"
        placeholder={"Enter Password"}
        register={register}
        error={errors.password}
        errorText={errors.password?.message}
      />

      <GButton type={"submit"} isDisabled={isPending} isLoading={isPending} label={"Login"} />
    </form>
  );
};
