export function SiteFooter() {
  return (
    <footer className="border-t border-border-footer">
      <div className="type-small mx-auto w-[calc(100%-60px)] max-w-[1140px] py-8 text-muted">
        © {new Date().getFullYear()} TradeGuardian
      </div>
    </footer>
  );
}
