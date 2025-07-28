// COMMENTED OUT: Individual report purchases disabled
// import { X } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// interface ReportLimitModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   currentUsage: number;
// }

// export function ReportLimitModal({ isOpen, onClose, currentUsage }: ReportLimitModalProps) {
//   const navigate = useNavigate();

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
//         >
//           <X className="h-5 w-5" />
//         </button>
//         
//         <div className="text-center">
//           <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
//             <svg
//               className="h-6 w-6 text-red-600"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//               />
//             </svg>
//           </div>
//           
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
//           
//           <p className="text-gray-500 mb-6">
//             You've used all {currentUsage} of your available reports. 
//             Please upgrade your plan or purchase more reports to continue.
//           </p>
//           
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive"
//             >
//               Maybe Later
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 onClose();
//                 navigate('/subscription');
//               }}
//               className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-olive hover:bg-olive-light hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive"
//             >
//               Purchase Reports
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// Temporary replacement component that returns null to prevent individual report purchases
export function ReportLimitModal({ isOpen: _isOpen, onClose: _onClose, currentUsage: _currentUsage }: { isOpen: boolean; onClose: () => void; currentUsage: number }) {
  return null; // Individual report purchases disabled
}
