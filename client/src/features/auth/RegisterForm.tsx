import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { PasswordChecklist } from "./PasswordChecklist";
import { useRegister } from "./useAuth";
import { registerSchema, type RegisterInput } from "./schemas";

export function RegisterForm({ onRegistered }: { onRegistered: () => void }) {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    const user = await registerUser.mutateAsync(values).catch(() => null);
    if (user) onRegistered();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email}
        {...register("email")}
      />
      <Input
        label="Username"
        help="1–50 characters"
        autoComplete="username"
        maxLength={50}
        error={errors.username}
        {...register("username")}
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        <PasswordChecklist error={errors.password} value={getValues("password") ?? ""} />
      </div>
      <Button type="submit" loading={registerUser.isPending} className="mt-0.5 w-full">
        Create account
      </Button>
    </form>
  );
}
