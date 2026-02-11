export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-6 text-center gap-4">
      <h1 className="text-3xl sm:text-4xl font-bold">404</h1>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
        This room does not exist.
      </p>
    </div>
  );
}
