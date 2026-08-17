import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function createMockGeolocation() {
  let successCallback: ((pos: GeolocationPosition) => void) | null = null;
  let errorCallback: ((err: GeolocationPositionError) => void) | null = null;

  const mockSuccess: GeolocationPosition = {
    coords: {
      latitude: 6.37,
      longitude: 2.39,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  };

  return {
    getCurrentPosition: vi.fn(
      (success: (pos: GeolocationPosition) => void, error: (err: GeolocationPositionError) => void) => {
        successCallback = success;
        errorCallback = error;
      }
    ),
    watchPosition: vi.fn(
      (success: (pos: GeolocationPosition) => void, error: (err: GeolocationPositionError) => void) => {
        successCallback = success;
        errorCallback = error;
        return 1;
      }
    ),
    clearWatch: vi.fn(),
    simulateSuccess(result?: Partial<GeolocationPosition>) {
      successCallback?.({ ...mockSuccess, ...result } as GeolocationPosition);
    },
    simulateError(code: number, message?: string) {
      errorCallback?.({
        code,
        message: message ?? "error",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    },
  };
}

describe("Geolocation mock behavior", () => {
  let mockGeo: ReturnType<typeof createMockGeolocation>;

  beforeEach(() => {
    mockGeo = createMockGeolocation();
    vi.stubGlobal("navigator", { geolocation: mockGeo });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getCurrentPosition registers callbacks", () => {
    mockGeo.getCurrentPosition(vi.fn(), vi.fn());
    expect(mockGeo.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("simulateSuccess calls the success callback", () => {
    const success = vi.fn();
    mockGeo.getCurrentPosition(success, vi.fn());
    mockGeo.simulateSuccess();
    expect(success).toHaveBeenCalledTimes(1);
    expect(success.mock.calls[0][0].coords.latitude).toBe(6.37);
  });

  it("simulateError calls the error callback", () => {
    const error = vi.fn();
    mockGeo.getCurrentPosition(vi.fn(), error);
    mockGeo.simulateError(1, "Permission denied");
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0].code).toBe(1);
  });

  it("success includes accuracy from coords", () => {
    const success = vi.fn();
    mockGeo.getCurrentPosition(success, vi.fn());
    mockGeo.simulateSuccess({ coords: { accuracy: 42 } as GeolocationCoordinates });
    expect(success.mock.calls[0][0].coords.accuracy).toBe(42);
  });

  it("error code 1 = PERMISSION_DENIED", () => {
    const error = vi.fn();
    mockGeo.getCurrentPosition(vi.fn(), error);
    mockGeo.simulateError(1);
    expect(error.mock.calls[0][0].code).toBe(1);
    expect(error.mock.calls[0][0].code).toBe(1); // PERMISSION_DENIED
  });

  it("error code 3 = TIMEOUT", () => {
    const error = vi.fn();
    mockGeo.getCurrentPosition(vi.fn(), error);
    mockGeo.simulateError(3);
    expect(error.mock.calls[0][0].code).toBe(3);
  });

  it("watchPosition registers callbacks", () => {
    mockGeo.watchPosition(vi.fn(), vi.fn());
    expect(mockGeo.watchPosition).toHaveBeenCalledTimes(1);
  });

  it("clearWatch works", () => {
    mockGeo.clearWatch();
    expect(mockGeo.clearWatch).toHaveBeenCalledTimes(1);
  });

  it("simulates the high-accuracy → low-accuracy fallback pattern", () => {
    // Pattern: first call fails (high accuracy), second call succeeds (low accuracy)
    let highAccCallback: ((pos: GeolocationPosition) => void) | null = null;
    let lowAccCallback: ((pos: GeolocationPosition) => void) | null = null;

    // High accuracy attempt
    mockGeo.getCurrentPosition(
      (pos) => { highAccCallback = pos as unknown as (pos: GeolocationPosition) => void; },
      (err) => {
        // On error, low accuracy fallback would be triggered
        mockGeo.getCurrentPosition(
          (pos) => { lowAccCallback = pos as unknown as (pos: GeolocationPosition) => void; },
          vi.fn()
        );
      }
    );

    // Simulate high accuracy failure
    mockGeo.simulateError(3, "Timeout");
    expect(mockGeo.getCurrentPosition).toHaveBeenCalledTimes(2);

    // Simulate low accuracy success
    mockGeo.simulateSuccess();
    expect(mockGeo.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it("simulates permission denied blocks further attempts", () => {
    mockGeo.getCurrentPosition(vi.fn(), vi.fn());
    mockGeo.simulateError(1, "Permission denied");
    // Only one call should have been made
    expect(mockGeo.getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
