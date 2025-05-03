import { db } from "@/server/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";


const page = async () => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in"); 
  }
  

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    
    if (!user.emailAddresses[0]?.emailAddress) {
      return notFound();
    }
    
    await (db as any).user.upsert({
        where: {
        email: user.emailAddresses[0].emailAddress ?? "",
      },
      update: {
        imageURL: user.imageUrl,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      create: {
        id: userId,
        email: user.emailAddresses[0].emailAddress ?? "",
        imageURL: user.imageUrl,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    
    return redirect("/dashboard");

};

export default page;