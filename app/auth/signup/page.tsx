import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

const Signup = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Continue to login</h1>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can only login at the moment.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="w-full flex justify-center">
          <Link href={"/auth/login"} className="w-full">
            <Button className="w-full">login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
