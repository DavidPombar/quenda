// SPDX-License-Identifier: AGPL-3.0-or-later
import { Box, Button, Spinner, Text } from "@chakra-ui/react";
import { PiArrowClockwise } from "react-icons/pi";
import { SpotArt } from "@/components/spot-art/spot-art.view";
export function Feedback({
  message,
  error,
  retry,
  retryLabel = "Volver tentar",
}: {
  message: string;
  error?: boolean;
  retry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Box role={error ? "alert" : "status"} className="feedback">
      {error ? <SpotArt kind="error" size="sm" /> : <Spinner size="sm" />}
      <Text>{message}</Text>
      {retry && (
        <Button variant="outline" onClick={retry}>
          <PiArrowClockwise size={18} aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </Box>
  );
}
