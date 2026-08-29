import Link from 'next/link';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Please Verify Your Email</h1>
        <p className="mb-6 text-muted-foreground">
          We have sent a verification link to <strong>{searchParams.email || 'your email address'}</strong>.
          <br />
          Please click the link in the email to verify your account before logging in.
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
