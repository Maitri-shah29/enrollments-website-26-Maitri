import { auth } from "@/lib/auth";
import SignIn from "./sign-in";
import { SignOut } from "./signout-button";

export default async function Greeting() {
  const session = await auth();
  console.log(session?.user);
  if (!session?.user) {
    return <SignIn />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <SignOut />
    </div>
  );
}
