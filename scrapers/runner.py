import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is loaded for Neon DB connectivity
_env_backend = Path(__file__).resolve().parents[1] / "backend" / ".env"
_env_root = Path(__file__).resolve().parents[1] / ".env"
if _env_backend.exists():
    load_dotenv(dotenv_path=_env_backend)
elif _env_root.exists():
    load_dotenv(dotenv_path=_env_root)

import argparse
import logging
from typing import List, Dict, Any

from rich.console import Console
from rich.table import Table
from rich.logging import RichHandler

from scrapers.github_trending_scraper import scrape_github_trending
from scrapers.fiverr_scraper import scrape_fiverr
from scrapers.upwork_rss_scraper import scrape_upwork_rss
from scrapers.db_loader import load_market_records

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True, show_path=False)],
)
logger = logging.getLogger("scrapers.runner")
console = Console(force_terminal=True, legacy_windows=False)


def run_pipeline(skills: List[str], platforms: List[str], dry_run: bool = False) -> Dict[str, Any]:
    """Runs modular scrapers across specified platforms, aggregates results, and persists to database."""
    console.print(
        f"\n[bold cyan]>>> Starting Skill-to-Income Market Scraping Pipeline[/bold cyan]"
    )
    console.print(f"[dim]Target Skills:[/dim] [green]{', '.join(skills)}[/green]")
    console.print(f"[dim]Platforms:[/dim] [yellow]{', '.join(platforms)}[/yellow]")
    console.print(f"[dim]Dry Run Mode:[/dim] [magenta]{dry_run}[/magenta]\n")

    all_records: List[Dict[str, Any]] = []

    # 1. GitHub Trending Scraper
    if "github" in platforms:
        console.print("[bold blue]* Scraping GitHub Trending & Search API...[/bold blue]")
        github_records = scrape_github_trending(skills)
        all_records.extend(github_records)
        console.print(f"  [green][+] {len(github_records)} GitHub records gathered.[/green]")

    # 2. Fiverr Freelance Scraper
    if "fiverr" in platforms:
        console.print("[bold green]* Scraping Fiverr Freelance Gigs...[/bold green]")
        fiverr_records = scrape_fiverr(skills)
        all_records.extend(fiverr_records)
        console.print(f"  [green][+] {len(fiverr_records)} Fiverr records gathered.[/green]")

    # 3. Upwork RSS Job Scraper
    if "upwork" in platforms:
        console.print("[bold blue]* Parsing Upwork Freelance RSS Feeds...[/bold blue]")
        upwork_records = scrape_upwork_rss(skills)
        all_records.extend(upwork_records)
        console.print(f"  [green][+] {len(upwork_records)} Upwork records gathered.[/green]")

    # Display Preview Table
    table = Table(title="Scraped Market Intelligence Sample", show_header=True, header_style="bold magenta")
    table.add_column("Platform", style="cyan", width=16)
    table.add_column("Category", style="green", width=22)
    table.add_column("Opportunity Title", style="white")
    table.add_column("Est. Rate", justify="right", style="yellow", width=12)
    table.add_column("Demand", justify="right", style="bold blue", width=8)
    table.add_column("Comp", justify="right", style="bold red", width=8)

    for item in all_records[:8]:
        table.add_row(
            item.get("platform", ""),
            item.get("category", ""),
            item.get("opportunity_title", "")[:45] + "...",
            f"${item.get('estimated_income', 0):,.0f}",
            str(item.get("demand_score", 0)),
            str(item.get("competition_score", 0)),
        )

    console.print(table)

    # 4. Ingest & Deduplicate into Neon DB
    console.print("\n[bold]* Normalizing & Persisting to Neon PostgreSQL...[/bold]")
    stats = load_market_records(all_records, dry_run=dry_run)

    console.print("\n[bold green][OK] Market Pipeline Execution Completed![/bold green]")
    console.print(
        f"  Total Scraped: [bold]{stats['total_scraped']}[/bold] | "
        f"Inserted: [bold green]{stats['inserted']}[/bold green] | "
        f"Updated: [bold yellow]{stats['updated']}[/bold yellow] | "
        f"Deduped: [bold cyan]{stats['deduped']}[/bold cyan]\n"
    )

    return stats


def main():
    parser = argparse.ArgumentParser(description="Skill-to-Income AI Engine (SIE) Market Scraper Runner")
    parser.add_argument(
        "--skills",
        type=str,
        default="python,fastapi,react,data science,automation",
        help="Comma-separated skills to scrape market demand for.",
    )
    parser.add_argument(
        "--platforms",
        type=str,
        default="github,fiverr,upwork",
        help="Comma-separated platforms to scrape (github, fiverr, upwork).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview scraped results without committing changes to the database.",
    )

    args = parser.parse_args()

    skill_list = [s.strip() for s in args.skills.split(",") if s.strip()]
    platform_list = [p.strip().lower() for p in args.platforms.split(",") if p.strip()]

    run_pipeline(skills=skill_list, platforms=platform_list, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
