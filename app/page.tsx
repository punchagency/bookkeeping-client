import Link from "next/link";

export default function Home() {
  return (
    <div className="w-screen h-screen flex items-center flex-col justify-center">
      <h1 className="text-4xl font-bold">Hi, Welcome</h1>
      <div>
        Please{" "}
        <Link href={"/auth/login"} className="underline">
          Login
        </Link>{" "}
        to continue
      </div>
    </div>
  );
}
