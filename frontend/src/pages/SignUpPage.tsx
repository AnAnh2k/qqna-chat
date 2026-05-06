import { SignupForm } from "@/components/auth/signup-form";

const SignUpPage = () => {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto bg-muted px-6 py-6 md:px-10 md:py-8 bg-gradient-purple">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  );
};

export default SignUpPage;
