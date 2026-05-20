export function ElpekasLogo() {
  return (
    <>
      {/* Full logotype — visible when sidebar is expanded */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logotype.svg"
        alt="ELPEKAS"
        width={102}
        height={41}
        className="group-data-[collapsible=icon]:hidden"
      />
      {/* Icon mark — visible when sidebar is collapsed */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.svg"
        alt="ELPEKAS"
        width={21}
        height={31}
        className="hidden group-data-[collapsible=icon]:block"
      />
    </>
  )
}
