import { Settings2 } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { groupByKey } from "../../helpers/help";
import { useSearchFilter } from "../hooks/useSearchFilter";

const RoomsList = () => {
  const [roomList, setRoomList] = useState([]);
  const navigate = useNavigate();

  const { query, setQuery, filters, setFilters, filteredData } =
    useSearchFilter(
      roomList,
      { searchKeys: ["name"] } // search by room name
    );

  const fetchRoomList = async () => {
    const response = await window.api.getRooms();
    if (Array.isArray(response)) {
      setRoomList(response);
    }
  };

  useEffect(() => {
    fetchRoomList();
  }, []);

  const groupedRooms = useMemo(() => {
    if (filteredData.length > 0) {
      return groupByKey(filteredData, "floor");
    }
    return {};
  }, [filteredData]);

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-auto">
      <div className="flex gap-2 items-center justify-end">
        <label className="input input-md">
          <svg
            className="h-[1em] opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <g
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.5"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input
            type="search"
            className="grow"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          value={filters.floor || ""}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, floor: e.target.value }))
          }
          className="select select-md w-32"
        >
          <option value="">All Floors</option>
          {[...new Set(roomList.map((r) => r.floor))].map(
            (floor, idx) =>
              floor && (
                <option key={idx} value={floor}>
                  Floor {floor}
                </option>
              )
          )}
        </select>
      </div>

      {/*  Render Rooms */}
      {Object.keys(groupedRooms).length > 0 ? (
        Object.entries(groupedRooms).map(([floor, rooms]) => (
          <div key={floor || "no-floor"}>
            <h2 className="text-lg font-bold mb-2">
              {floor && floor !== "null" && floor !== "undefined"
                ? `Floor ${floor}`
                : "No Floor"}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {rooms.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/rooms_control/${item?.id}`)}
                  className="card bg-base-100 image-full h-40 shadow-sm mb-2 cursor-pointer hover:border"
                >
                  <figure>
                    <img
                      className="object-cover w-full"
                      src="https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=1915&auto=format&fit=crop"
                    />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title">{item?.name}</h2>
                    <p>
                      Devices in room :{" "}
                      <span className="font-bold">{item?.devices?.length}</span>{" "}
                      devices
                    </p>
                    <div className="card-actions justify-end">
                      <button className="btn btn-primary btn-sm">
                        <Settings2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center opacity-50">No result found.</p>
      )}
    </div>
  );
};

export default RoomsList;
