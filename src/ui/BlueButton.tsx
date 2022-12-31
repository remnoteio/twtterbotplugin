export const BlueButton = (props: any) => {
  return (
    <div className="bg-blue-50 p-2 cursor-pointer text-white rounded mb-2 text-center">
      {props.children}
    </div>
  );
};
