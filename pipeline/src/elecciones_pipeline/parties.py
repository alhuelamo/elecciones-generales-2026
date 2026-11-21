from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import yaml

from elecciones_pipeline.normalize import slugify


class DuplicateAlias(Exception):
    pass


@dataclass(frozen=True)
class LogoRecord:
    file: str
    source_url: str
    license: str
    author: str


@dataclass(frozen=True)
class PartyEntry:
    key: str
    name: str
    tier: Literal["full", "basic"]
    aliases: tuple[str, ...]
    website: str | None
    programme_url: str | None
    leader: str | None
    founded: int | None
    seats_2023: tuple[int, int] | None
    wikipedia_es: str | None
    wikipedia_ca: str | None


class PartyCatalog:
    def __init__(self, entries: list[PartyEntry]):
        self._entries = entries
        self._key_by_alias_slug = self._index_aliases(entries)

    def match(self, acronym: str) -> str | None:
        return self._key_by_alias_slug.get(slugify(acronym))

    def match_candidacy(self, acronym: str, denomination: str) -> str | None:
        return self.match(acronym) or self.match(denomination)

    def to_json(self, logos: dict[str, LogoRecord]) -> dict:
        return {
            "parties": {
                entry.key: _party_json(entry, logos.get(entry.key))
                for entry in self._entries
            }
        }

    @staticmethod
    def _index_aliases(entries: list[PartyEntry]) -> dict[str, str]:
        index: dict[str, str] = {}
        for entry in entries:
            for alias_slug in {slugify(alias) for alias in entry.aliases}:
                owner = index.setdefault(alias_slug, entry.key)
                if owner != entry.key:
                    raise DuplicateAlias(
                        f"alias '{alias_slug}' used by '{owner}' and '{entry.key}'"
                    )
        return index


def load_party_catalog(parties_yaml: Path) -> PartyCatalog:
    raw = _read_mapping(parties_yaml)
    return PartyCatalog([_parse_entry(key, fields) for key, fields in raw.items()])


def load_logos(logos_yaml: Path) -> dict[str, LogoRecord]:
    return {
        key: LogoRecord(
            file=fields["file"],
            source_url=fields["sourceUrl"],
            license=fields["license"],
            author=fields["author"],
        )
        for key, fields in _read_mapping(logos_yaml).items()
    }


def _read_mapping(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def _parse_entry(key: str, fields: dict) -> PartyEntry:
    seats = fields.get("seats2023")
    wikipedia = fields.get("wikipedia") or {}
    return PartyEntry(
        key=key,
        name=fields["name"],
        tier=fields.get("tier", "basic"),
        aliases=tuple(fields.get("aliases", ())),
        website=fields.get("website"),
        programme_url=fields.get("programmeUrl"),
        leader=fields.get("leader"),
        founded=fields.get("founded"),
        seats_2023=(seats["congreso"], seats["senado"]) if seats else None,
        wikipedia_es=wikipedia.get("es"),
        wikipedia_ca=wikipedia.get("ca"),
    )


def _party_json(entry: PartyEntry, logo: LogoRecord | None) -> dict:
    return {
        "key": entry.key,
        "name": entry.name,
        "logo": _logo_json(logo),
        "website": entry.website,
        "programmeUrl": entry.programme_url,
        "leader": entry.leader,
        "founded": entry.founded,
        "seats2023": _seats_json(entry.seats_2023),
        "wikipedia": {"es": entry.wikipedia_es, "ca": entry.wikipedia_ca},
    }


def _logo_json(logo: LogoRecord | None) -> dict | None:
    if logo is None:
        return None
    return {
        "path": f"logos/{logo.file}",
        "sourceUrl": logo.source_url,
        "license": logo.license,
        "author": logo.author,
    }


def _seats_json(seats: tuple[int, int] | None) -> dict | None:
    if seats is None:
        return None
    return {"congreso": seats[0], "senado": seats[1]}
