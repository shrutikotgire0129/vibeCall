import { CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import MobileNav from "./MobileNav";
import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";

const Navbar = () => {
  return (
    <nav className="flex flex-between fixed z-50 w-full bg-dark-1 px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="VibeCall logo"
          className="max-sm:size-10 h-auto w-6"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          VibeCall
        </p>
      </Link>
      <div className="flex-between gap-5">
        <Show when="signed-out">
          <SignInButton>
            <button className=" text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 cursor-pointer whitespace-nowrap">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="bg-blue-1 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 cursor-pointer whitespace-nowrap">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Link
            href="/calendar"
            aria-label="Calendar"
            title="Calendar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition"
          >
            <CalendarDays size={24} />
          </Link>

          <UserButton />
        </Show>
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
