export function ThankYou() {
  return (
    <div className="section-spacing">
      <div className="container-custom text-center">
        <h1 className="text-4xl font-bold mb-6">Thank You!</h1>
        <p className="text-lg text-gray-700 mb-4">
          Your payment was successful. Check your email for confirmation.
        </p>
        <a href="/" className="text-purple-600 hover:underline">
          Return to home
        </a>
      </div>
    </div>
  );
}
