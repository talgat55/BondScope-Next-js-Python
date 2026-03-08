"""
API tests: health, trades, bonds, watchlist, prices (mocked), AI 501 when no key.
"""
import pytest
from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_trades_crud(client: TestClient) -> None:
    r = client.get("/trades")
    assert r.status_code == 200
    assert r.json() == []

    r = client.post(
        "/trades",
        json={
            "ticker": "AAPL.US",
            "quantity": 10,
            "buy_price": 150.5,
            "buy_date": "2024-01-15",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["ticker"] == "AAPL.US"
    assert data["quantity"] == 10
    assert data["buy_price"] == 150.5
    assert data["buy_date"] == "2024-01-15"
    assert "id" in data
    trade_id = data["id"]

    r = client.get("/trades")
    assert r.status_code == 200
    assert len(r.json()) == 1

    r = client.delete(f"/trades/{trade_id}")
    assert r.status_code == 200
    r = client.get("/trades")
    assert r.json() == []


def test_trades_delete_404(client: TestClient) -> None:
    r = client.delete("/trades/99999")
    assert r.status_code == 404


def test_bonds_crud(client: TestClient) -> None:
    r = client.get("/bonds")
    assert r.status_code == 200
    assert r.json() == []

    r = client.post(
        "/bonds",
        json={
            "name": "Gov Bond",
            "face": 1000,
            "coupon_rate": 0.05,
            "coupon_freq": 2,
            "price": 98,
            "maturity_date": "2029-12-31",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Gov Bond"
    assert data["face"] == 1000
    assert data["price"] == 98
    assert "id" in data
    bond_id = data["id"]

    r = client.get("/bonds")
    assert len(r.json()) == 1

    r = client.get(f"/bonds/{bond_id}/metrics")
    assert r.status_code == 200
    metrics = r.json()
    assert "ytm" in metrics
    assert "duration" in metrics
    assert "cashflows" in metrics

    r = client.delete(f"/bonds/{bond_id}")
    assert r.status_code == 200
    r = client.get("/bonds")
    assert r.json() == []


def test_bonds_delete_404(client: TestClient) -> None:
    r = client.delete("/bonds/99999")
    assert r.status_code == 404


def test_watchlist_crud(client: TestClient) -> None:
    r = client.get("/watchlist")
    assert r.status_code == 200
    assert r.json() == []

    r = client.post("/watchlist", json={"ticker": "MSFT.US"})
    assert r.status_code == 200
    data = r.json()
    assert data["ticker"] == "MSFT.US"
    assert "id" in data
    watch_id = data["id"]

    r = client.get("/watchlist")
    assert len(r.json()) == 1

    r = client.delete(f"/watchlist/{watch_id}")
    assert r.status_code == 200
    r = client.get("/watchlist")
    assert r.json() == []


def test_prices_no_ticker(client: TestClient) -> None:
    r = client.get("/prices")
    assert r.status_code == 422  # missing query param


def test_prices_mock(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock Stooq so we don't hit the network."""
    def fake_fetch(ticker: str) -> float | None:
        return 100.0 if ticker else None

    monkeypatch.setattr("main._fetch_price_from_stooq", fake_fetch)
    r = client.get("/prices?ticker=FAKE.US")
    assert r.status_code == 200
    assert r.json()["ticker"] == "FAKE.US"
    assert r.json()["price"] == 100.0


def test_ai_report_disabled(client: TestClient) -> None:
    """Without MISTRAL_API_KEY, AI returns 501."""
    r = client.post("/ai/report", json={})
    assert r.status_code == 501
    assert "MISTRAL_API_KEY" in r.json()["detail"]


def test_ai_chat_disabled(client: TestClient) -> None:
    r = client.post("/ai/chat", json={"message": "Hello"})
    assert r.status_code == 501
    assert "MISTRAL_API_KEY" in r.json()["detail"]
