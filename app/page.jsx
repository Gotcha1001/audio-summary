import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-purple-900 to-black text-white min-h-screen flex items-center">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Audio to Meeting Minutes
        </h1>
        <div className="flex items-center justify-center space-y-10">
          <Image src="/favicon.jpg" alt="Image" height={300} width={300}
            className="h-[400] w-[400] rounded-lg" />
        </div>

        <p className="text-lg md:text-xl mb-6 mt-5">
          Transform your meeting audio into professional minutes with ease.
        </p>
        <Link href="/upload">
          <button className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-7 rounded-lg transition duration-300">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
}
