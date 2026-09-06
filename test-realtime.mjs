import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const envStr = fs.readFileSync(".env", "utf8");
envStr.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
});

const prisma = new PrismaClient();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretStr = process.env.SUPABASE_JWT_SECRET;

  if (!url || !anonKey || !secretStr) {
    console.error("Missing env vars");
    return;
  }

  // Get first user and conversation
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found");
    return;
  }
  
  let conv = await prisma.conversation.findFirst({
    where: { participants: { some: { userId: user.id } } }
  });
  
  if (!conv) {
    console.error("No conversation found for user");
    return;
  }

  console.log(`Testing with User: ${user.id}, Conversation: ${conv.id}`);

  // Generate bridge token
  const secret = new TextEncoder().encode(secretStr);
  const token = await new SignJWT({ role: "authenticated" })
    .setAudience("authenticated")
    .setSubject(user.id)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(secret);

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  client.realtime.setAuth(token);

  const channel = client.channel(`test-channel-${conv.id}`);

  let received = false;

  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "Message" }, (payload) => {
      console.log("RECEIVED PAYLOAD:", payload);
      received = true;
    })
    .subscribe(async (status) => {
      console.log("Channel status:", status);
      if (status === "SUBSCRIBED") {
        console.log("Inserting message via Prisma...");
        await prisma.message.create({
          data: {
            body: "Test Realtime Message " + Date.now(),
            conversationId: conv.id,
            senderId: user.id,
          }
        });
        
        setTimeout(() => {
          if (!received) console.log("FAILED: No event received after 3 seconds");
          process.exit(0);
        }, 3000);
      }
    });
}

main();
