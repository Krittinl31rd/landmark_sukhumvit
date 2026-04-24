import React, { useState, useEffect, useMemo } from "react";
import Air from "../components/devices/Air";
import Light from "../components/devices/Light";
import { useParams } from "react-router-dom";
import Breadcrumbs from "../components/shared/Breadcrumbs";
import { ArrowLeft, Clipboard, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Sence from "../components/devices/Sence";

const RoomControl = () => {
  const navigate = useNavigate();
  const { room_id } = useParams();
  const [room, setRoom] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const fetchRoom = async () => {
    const response = await window.api.getRoomById(room_id);
    if (response) {
      setRoom(response);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [room_id]);

  useEffect(() => {
    const handleReadData = (payload) => {
      if (isSending) return; // ✅ ตอนนี้จะทำงานจริง
      // console.log(payload);
      const {
        gateway_id,
        room_id: payloadRoomId,
        device_id,
        control_id,
        control_value,
      } = payload;

      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;
        if (
          prevRoom.id !== payloadRoomId ||
          prevRoom.gateway_id !== gateway_id
        ) {
          return prevRoom;
        }

        return {
          ...prevRoom,
          devices: prevRoom.devices.map((device) => {
            if (device.device_id !== device_id) return device;

            return {
              ...device,
              device_control: device.device_control.map((control) =>
                control.control_id === control_id
                  ? { ...control, control_value }
                  : control
              ),
            };
          }),
        };
      });
    };

    window.modbusAPI.onReadData(handleReadData);
    return () => window.modbusAPI.offReadData(handleReadData);
  }, [isSending]); //  สำคัญมาก

  const airDevices = useMemo(
    () => room?.devices?.filter((item) => item.device_type == 1) || [],
    [room]
  );
  const lightDevices = useMemo(
    () => room?.devices?.filter((item) => item.device_type == 4) || [],
    [room]
  );

  const senceDevices = useMemo(
    () => room?.devices?.filter((item) => item.device_type == 10) || [],
    [room]
  );

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <Link className="btn btn-xs btn-outline" to={"/rooms_control"}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-semibold">{room?.name}</h1>
      </div>

      {room?.devices.filter((item) => item.device_type != 99).length > 0 ? (
        <div className="grid grid-cols-[250px_1fr] gap-2 h-full overflow-hidden">
          <div className="overflow-auto space-y-2">
            {airDevices.length > 0 ? (
              <Air
                isSending={isSending}
                setIsSending={setIsSending}
                setRoom={setRoom}
                gateway_id={room?.gateway_id}
                airDevices={airDevices}
              />
            ) : (
              <p className="text-center text-opacity-50">No item device.</p>
            )}
          </div>

          <div className="overflow-auto space-y-2">
            {senceDevices.length > 0 && (
              <Sence
                isSending={isSending}
                setIsSending={setIsSending}
                setRoom={setRoom}
                gateway_id={room?.gateway_id}
                senceDevices={senceDevices}
              />
            )}
            {lightDevices.length > 0 ? (
              <Light
                setRoom={setRoom}
                isSending={isSending}
                setIsSending={setIsSending}
                gateway_id={room?.gateway_id}
                lightDevices={lightDevices}
              />
            ) : (
              <p className="text-center text-opacity-50">No item device.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-opacity-50">No item device.</p>
      )}
    </div>
  );
};

export default RoomControl;
