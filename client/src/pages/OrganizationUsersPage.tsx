import { useRef, useState } from "react";
import type { ChangeEventHandler, MouseEvent, ReactNode } from "react";
import { Clipboard, Eye, EyeClosed, MailPlus, Plus, Trash2, UserRoundPlus } from "lucide-react";
import Field from "../components/Field";
import InputField from "../components/InputField";
import Label from "../components/Label";
import SelectField from "../components/SelectField";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addMemberToOrganization,
  generateInviteTokenForMember,
  getInvitedMembers,
  removeInvitedMember,
} from "../lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export interface OrganizationMember {
  name: string;
  email: string;
  role: string;
  token?: string;
  tokenShown?: boolean;
}

const defaultForm = {
  name: "",
  email: "",
  role: "viewer",
};

export default function OrganizationUsersPage() {
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<
    "success" | "error" | "info" | ""
  >("");
  const [tokens, setTokens] = useState<OrganizationMember[]>([]);
 
 

  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["invitedMembers"],
    queryFn: () => getInvitedMembers(),
  });



  const addMutation = useMutation({
    mutationFn: addMemberToOrganization,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invitedMembers"] });
      setMessageTone("success");
      setMessage("Member added successfully");
      window.setTimeout(() => {
        setMessage("");
        setMessageTone("");
      }, 3000);
    },
    onError: (error) => {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "Error adding member",
      );
      window.setTimeout(() => {
        setMessage("");
        setMessageTone("");
      }, 3000);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeInvitedMember,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invitedMembers"] });
      setMessageTone("success");
      setMessage("Member removed successfully");
      window.setTimeout(() => {
        setMessage("");
        setMessageTone("");
      }, 3000);
    },
    onError: (error) => {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "Error removing member",
      );
      window.setTimeout(() => {
        setMessage("");
        setMessageTone("");
      }, 3000);
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn:generateInviteTokenForMember,
    onSuccess: (data) => {
      setTokens((prev: OrganizationMember[]) => [...prev, {...data,tokenShown:true}]);
    }
  })
  

  const handleChange: ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = () => {
    const newMember: OrganizationMember = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    };

    addMutation.mutate(newMember);
    setForm(defaultForm);
  };

  const handleRemoveMember = (email: string) => {
    // Logic to remove a member from the organization
    removeMutation.mutate(email);
    setMessage("Member removed successfully");
    setMessageTone("success");
    window.setTimeout(() => {
      setMessage("");
      setMessageTone("");
    }, 2500);
  };

  function selectAndCopy(e: MouseEvent<HTMLButtonElement>) {
   
    const copybtn= e.currentTarget
    const textArea = copybtn.closest('.token-area')
    textArea?.querySelector('textarea')?.select();
    navigator.clipboard.writeText(textArea?.querySelector('textarea')?.value as string);
    e.currentTarget.parentElement?.lastElementChild?.classList.remove("invisible");

    setTimeout(() => {
      copybtn.parentElement?.lastElementChild?.classList.add("invisible");
    }, 3000);
    
  }

  function generateInviteToken(email: string): void {
    if(tokens.filter((t) => t.email === email && t.tokenShown).length>0) 
    {
      setTokens(prev=> prev.filter((t) => t.email !== email));
      return;
    }
    generateTokenMutation.mutate(email);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-rows">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Invite member
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Add a new user
              </h3>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
              <MailPlus className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="name">Name</Label>
              <InputField
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Avery Johnson"
              />
            </Field>
            <Field>
              <Label htmlFor="email">Email</Label>
              <InputField
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="avery@company.com"
              />
            </Field>
            <Field>
              <Label htmlFor="role">Role</Label>
              <SelectField
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="admin">Admin</option>
                <option value="billing_analyst">Billing Analyst</option>
                <option value="viewer">Viewer</option>
                <option value="finance_lead">Finance Lead</option>
              </SelectField>
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddMember}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Add user
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {message ? (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                messageTone === "success"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : messageTone === "error"
                    ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                    : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-6 shadow-glow sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Invited members
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">
              {!!members && members.length} users
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {!!members &&
              members.map((member) => (
                <article
                  key={member.email}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {member.name}
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">
                        {member.email}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200">
                      {member.role}
                    </span>
                  </div>

                  <div className="flex items-center token-area justify-between">
                    <div className="flex flex-col items-center w-full">
                      <textarea
                        value={tokens.find((t) => t.email === member.email && t.tokenShown)?.token || ""}
                        readOnly
                       
                        name="token"
                        className="resize-none w-full mt-4 mr-4 border rounded-md p-2 border-emerald-400/20 bg-transparent focus:outline-none focus:ring-0"
                      />
                      {<button
                        id="copyBtn"
                        className={`${tokens.find((t) => t.email === member.email && t.tokenShown)?.token ? "" : "invisible"} 
                        mt-2 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 cursor-pointer focus:outline-none`}
                        onClick={(e:MouseEvent<HTMLButtonElement>) => {
                          selectAndCopy(e);
                        }}
                      >
                        <Clipboard className="h-4 w-4" /> Copy token
                      </button>}
                      <div className="invisible text-sm text-emerald-400/95">
                        Copied
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => generateInviteToken(member.email)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                        >
                          Token
                          {tokens.find((t) => t.email === member.email && t.tokenShown)?.token ? <Eye className="h-4 w-4" /> : <EyeClosed className="h-4 w-4" />}
                         
                        </button>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.email)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                        >
                          Remove
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
