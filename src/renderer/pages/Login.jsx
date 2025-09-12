import { User, KeyRound } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/UserContext";
import { toast } from "react-toastify";

const Login = () => {
  const [form, setForm] = useState({ username: "admin", password: "123456" });
  const navigate = useNavigate();
  const { login, auth } = useAuth();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await window.api.login(form.username, form.password);
      if (res?.result?.success == true) {
        if (res?.result?.token) {
          login(res.result.token);
          navigate("/rooms");
          toast.success("Welcome back.");
        }
      } else {
        toast.error(res?.result?.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // useEffect(() => {
  //   if (auth?.token) {
  //     navigate("/rooms");
  //     toast.success("Welcome back.");
  //   }
  // }, [auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-base-100 p-4 rounded-box w-80"
      >
        <div>
          <label className="input input-lg focus:outline-none">
            <User className="opacity-50 w-6 h-6" />
            <input
              name="username"
              value={form.username}
              type="text"
              required
              placeholder="Username"
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label className="input input-lg">
            <KeyRound className="opacity-50 w-6 h-6" />
            <input
              name="password"
              value={form.password}
              type="password"
              required
              placeholder="Password"
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="w-full">
          <button className="btn btn-primary w-full">Login</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
