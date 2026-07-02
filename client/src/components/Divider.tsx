
type DividerPropType ={
text:string;
}

export default function Divider({text}:DividerPropType){
    return (<div className="relative flex py-2 items-center">
                 <span className="flex-grow border-t border-gray-200" />
                <span className="flex-shrink ml-2 mr-4 text-sm font-semibold tracking wide text-cyan-300 uppercase">
                {text}</span>
                <span className="flex-grow border-t border-gray-200" />
              </div>)
}