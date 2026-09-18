import {
	Building2,
	Eye,
	EyeOff,
	LockKeyhole,
	Mail,
	User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const initialForm = {
	name: "",
	email: "",
	department: "",
	password: "",
	confirmPassword: "",
};

const CreateAccount = () => {
	const navigate = useNavigate();
	const [form, setForm] = useState(initialForm);
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	const handleChange = (event) => {
		const { name, value } = event.target;

		setForm((currentForm) => ({ ...currentForm, [name]: value }));
		setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
		setSuccessMessage("");
	};

	const validateForm = () => {
		const nextErrors = {};

		if (!form.name.trim()) nextErrors.name = "Please enter your full name.";
		if (!form.email.trim()) {
			nextErrors.email = "Please enter your email address.";
		} else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
			nextErrors.email = "Please enter a valid email address.";
		}
		if (!form.department.trim()) {
			nextErrors.department = "Please enter your department.";
		}
		if (!form.password) {
			nextErrors.password = "Please create a password.";
		} else if (form.password.length < 8) {
			nextErrors.password = "Your password must be at least 8 characters.";
		}
		if (!form.confirmPassword) {
			nextErrors.confirmPassword = "Please confirm your password.";
		} else if (form.password !== form.confirmPassword) {
			nextErrors.confirmPassword = "Passwords do not match.";
		}

		return nextErrors;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (loading || successMessage) return;

		setSuccessMessage("");

		const nextErrors = validateForm();
		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			return;
		}

		setErrors({});
		setLoading(true);

		try {
			await api.post("/auth/register", {
				name: form.name.trim(),
				email: form.email.trim(),
				password: form.password,
				department: form.department.trim(),
			});

			setSuccessMessage(
				"Account created successfully. Please contact your administrator for role assignment.",
			);
			window.setTimeout(() => navigate("/"), 2000);
		} catch (requestError) {
			setErrors({
				form:
					requestError.response?.data?.message ||
					"We couldn't create your account. Please check your details and try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	const fieldClassName = (fieldName) =>
		`h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${
			errors[fieldName] ? "border-red-300" : "border-slate-200"
		}`;

	return (
		<main className="min-h-screen bg-[#f5f7fa] p-4">
			<div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_70px_rgba(15,23,42,0.10)]">
				<section className="relative hidden w-1/2 overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
					<div>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-slate-950">
								EP
							</div>
							<span className="text-lg font-semibold tracking-tight text-white">
								Employee Portal
							</span>
						</div>

						<div className="mt-24 max-w-md">
							<p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
								Workspace
							</p>
							<h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white">
								Build your workspace profile.
							</h1>
							<p className="mt-6 max-w-sm text-base leading-7 text-slate-400">
								Create your account and get started with your employee
								workspace.
							</p>
						</div>
					</div>

					<span className="text-sm text-slate-500">© 2026 Employee Portal</span>
				</section>

				<section className="flex w-full items-center justify-center px-6 py-12 sm:px-12 lg:w-1/2">
					<div className="w-full max-w-md">
						<div className="mb-8">
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
								<User size={22} className="text-slate-700" />
							</div>
							<h2 className="text-3xl font-semibold tracking-tight text-slate-900">
								Create your account
							</h2>
							<p className="mt-2 text-sm leading-6 text-slate-500">
								Enter your details to create your employee portal account.
							</p>
						</div>

						<form className="space-y-4" onSubmit={handleSubmit} noValidate>
							<div>
								<label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
									Full name
								</label>
								<div className="relative">
									<User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
									<input id="name" name="name" type="text" placeholder="Enter your full name" value={form.name} onChange={handleChange} className={fieldClassName("name")} autoComplete="name" />
								</div>
								{errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
							</div>

							<div>
								<label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
									Email address
								</label>
								<div className="relative">
									<Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
									<input id="email" name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} className={fieldClassName("email")} autoComplete="email" />
								</div>
								{errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
							</div>

							<div>
								<label htmlFor="department" className="mb-2 block text-sm font-medium text-slate-700">
									Department
								</label>
								<div className="relative">
									<Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
									<select id="department" name="department" required value={form.department} onChange={handleChange} className={fieldClassName("department")}>
										<option value="">Select a department</option>
										<option value="HR">HR</option>
										<option value="Sales">Sales</option>
										<option value="Support">Support</option>
										<option value="Finance">Finance</option>
									</select>
								</div>
								{errors.department && <p className="mt-1.5 text-xs text-red-600">{errors.department}</p>}
							</div>

							<div>
								<label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
									Password
								</label>
								<div className="relative">
									<LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
									<input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={form.password} onChange={handleChange} className={`${fieldClassName("password")} pr-12`} autoComplete="new-password" />
									<button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>
										{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
								{errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
							</div>

							<div>
								<label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
									Confirm password
								</label>
								<div className="relative">
									<LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
									<input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={form.confirmPassword} onChange={handleChange} className={`${fieldClassName("confirmPassword")} pr-12`} autoComplete="new-password" />
									<button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
										{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
								{errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>}
							</div>

							{errors.form && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>}
							{successMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>}

							<button type="submit" disabled={loading || Boolean(successMessage)} className="h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70">
								{loading ? "Creating account..." : "Create account"}
							</button>
						</form>

						<p className="mt-8 text-center text-sm text-slate-500">
							Already have an account?{" "}
							<button type="button" onClick={() => navigate("/")} className="font-semibold text-slate-900 transition hover:text-slate-600">
								Sign in
							</button>
						</p>
					</div>
				</section>
			</div>
		</main>
	);
};

export default CreateAccount;
