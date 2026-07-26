import * as React from "react";
import type { ToastProps } from "./toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
    id: string;
    title?: string;
    description?: string;
    variant?: "default" | "success" | "destructive";
};

let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}

type State = { toasts: ToasterToast[] };
type Action =
    | { type: "ADD_TOAST"; toast: ToasterToast }
    | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
    | { type: "DISMISS_TOAST"; toastId?: string }
    | { type: "REMOVE_TOAST"; toastId?: string };

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string) {
    if (toastTimeouts.has(toastId)) return;
    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({ type: "REMOVE_TOAST", toastId });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "ADD_TOAST":
            return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
            };
        case "DISMISS_TOAST": {
            const { toastId } = action;
            if (toastId) addToRemoveQueue(toastId);
            else state.toasts.forEach((t) => addToRemoveQueue(t.id));
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === toastId || toastId === undefined ? { ...t, open: false } : t,
                ),
            };
        }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) return { ...state, toasts: [] };
            return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
    }
}

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((l) => l(memoryState));
}

export function toast(props: Omit<ToasterToast, "id">) {
    const id = genId();
    dispatch({
        type: "ADD_TOAST",
        toast: { ...props, id, open: true, onOpenChange: (open) => !open && dispatch({ type: "DISMISS_TOAST", toastId: id }) },
    });
    return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) };
}

export function useToast() {
    const [state, setState] = React.useState<State>(memoryState);
    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const idx = listeners.indexOf(setState);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);
    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    };
}
