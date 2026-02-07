// import * as Sentry from "@sentry/react";

// export default function ErrorBoundary({ children }) {
//   return (
//     <Sentry.ErrorBoundary
//       fallback={({ error, resetError }) => (
//         <div className="min-h-[60vh] grid place-items-center p-6">
//           <div className="max-w-lg w-full bg-white shadow rounded-2xl p-6 text-center">
//             <h2 className="text-xl font-semibold text-gray-900">Ops! Algo deu errado.</h2>
//             <p className="text-sm text-gray-600 mt-2">
//               Já registramos o erro e vamos investigar. Você pode tentar novamente.
//             </p>
//             <pre className="text-xs bg-gray-50 p-3 rounded mt-4 overflow-auto text-gray-500">
//               {String(error?.message || "Erro desconhecido")}
//             </pre>
//             <button
//               className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
//               onClick={resetError}
//             >
//               Tentar novamente
//             </button>
//           </div>
//         </div>
//       )}
//     >
//       {children}
//     </Sentry.ErrorBoundary>
//   );
// }
