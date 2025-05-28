import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="container max-w-md py-16 flex flex-col items-center">
      <Link href="/" className="mb-8 text-primary hover:underline flex items-center">
        ← Back to home
      </Link>
      
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Start your journey to better habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}