import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

export function Prose({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const preBlocks = container.querySelectorAll("pre");
    const buttons: HTMLButtonElement[] = [];
    // The "copied" confirmation schedules a timer that outlives a fast
    // navigation; track them so cleanup can cancel any still pending.
    const timers = new Set<ReturnType<typeof setTimeout>>();

    for (const pre of preBlocks) {
      // Reuse an existing wrapper (e.g. StrictMode re-run, where cleanup
      // removed the button but left the wrapper). Skip only when the copy
      // button is still present.
      const existingWrapper = pre.parentElement?.classList.contains(
        "code-block-wrapper"
      )
        ? (pre.parentElement as HTMLElement)
        : null;
      if (existingWrapper?.querySelector(".code-copy-btn")) continue;

      let wrapper = existingWrapper;
      if (!wrapper) {
        // Wrap pre in a relative container for the copy button
        wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper";
        pre.parentNode!.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Make the pre scrollable
        pre.style.overflowX = "auto";
      }

      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="1"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`;

      btn.addEventListener("click", () => {
        const code = pre.querySelector("code");
        const text = code?.textContent ?? pre.textContent ?? "";
        navigator.clipboard
          .writeText(text)
          .then(() => {
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
            btn.classList.add("copied");
            const timer = setTimeout(() => {
              timers.delete(timer);
              btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="1"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`;
              btn.classList.remove("copied");
            }, 1500);
            timers.add(timer);
          })
          .catch(() => {
            // Clipboard access can be denied (insecure context, permissions).
            // Leave the button in its idle state rather than raising an
            // unhandled rejection.
          });
      });

      // Button goes on the wrapper (outside the scrollable pre)
      wrapper.appendChild(btn);
      buttons.push(btn);
    }

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers.clear();
      for (const btn of buttons) {
        btn.remove();
      }
    };
  }, [props.dangerouslySetInnerHTML?.__html]);

  return (
    <div
      ref={ref}
      className={cn(
        "prose prose-base max-w-[72ch] dark:prose-invert",
        // body text
        "prose-p:leading-7 prose-p:text-foreground/95 dark:prose-p:text-foreground/90",
        // headings
        "prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-h1:text-4xl prose-h1:tracking-[-0.02em]",
        "prose-h2:mt-12 prose-h2:text-2xl prose-h2:tracking-[-0.01em]",
        "prose-h3:mt-8 prose-h3:text-xl",
        // links
        "prose-a:text-brand prose-a:font-medium prose-a:underline prose-a:underline-offset-4 prose-a:decoration-brand/40 hover:prose-a:decoration-brand",
        // inline code
        "prose-code:before:content-none prose-code:after:content-none prose-code:rounded-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:font-medium prose-code:text-foreground",
        // code blocks — CSS handles everything
        "prose-pre:my-6 prose-pre:rounded-none prose-pre:border-0 prose-pre:p-0 prose-pre:shadow-none prose-pre:bg-transparent",
        // lists
        "prose-li:text-foreground/95 dark:prose-li:text-foreground/90 prose-li:leading-7",
        "prose-ul:my-4 prose-ol:my-4",
        // hr
        "prose-hr:border-border prose-hr:my-10",
        // blockquote
        "prose-blockquote:border-l-2 prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:font-normal prose-blockquote:not-italic",
        // strong
        "prose-strong:font-semibold prose-strong:text-foreground",
        // tables
        "prose-table:text-sm prose-th:text-foreground prose-th:font-semibold prose-td:text-foreground/80 prose-td:py-2",
        // images — Nova-style: rounded, subtle border, soft shadow
        "prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-lg prose-img:shadow-black/5 dark:prose-img:shadow-black/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
